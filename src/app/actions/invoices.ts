"use server";

import * as z from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getTenantDb, getTenantContext, requireRole } from "@/lib/tenant-db";
import { computeInvoiceTotals, isInterStateSupply } from "@/lib/billing/gst";
import { getNextInvoiceNumber } from "@/lib/billing/invoice-number";
import {
  InvoiceLineSchema,
  SalesInvoiceFormSchema,
  type SalesInvoiceFormState,
} from "@/lib/validations/invoice";

export async function createSalesInvoice(
  _state: SalesInvoiceFormState,
  formData: FormData
): Promise<SalesInvoiceFormState> {
  const context = await getTenantContext();
  requireRole(context, ["OWNER", "MANAGER", "CASHIER"]);

  const validatedFields = SalesInvoiceFormSchema.safeParse(Object.fromEntries(formData));
  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { partyId, invoiceDate, notes, billDiscountPercent, amountPaid, paymentMode, itemsJson } =
    validatedFields.data;

  let rawItems: unknown;
  try {
    rawItems = JSON.parse(itemsJson);
  } catch {
    return { errors: { itemsJson: ["Invalid item data."] } };
  }

  const itemsResult = z.array(InvoiceLineSchema).min(1, { error: "Add at least one item." }).safeParse(rawItems);
  if (!itemsResult.success) {
    return { errors: { itemsJson: ["One or more items are invalid."] } };
  }
  const items = itemsResult.data;

  const db = await getTenantDb();

  const [tenant, party] = await Promise.all([
    prisma.tenant.findUniqueOrThrow({ where: { id: context.tenantId } }),
    db.party.findUnique({ where: { id: partyId } }),
  ]);

  if (!party) {
    return { errors: { partyId: ["Select a valid customer."] } };
  }

  const productIds = items.map((item) => item.productId).filter((id): id is string => !!id);
  const hsnByProductId = new Map<string, string | null>();
  if (productIds.length > 0) {
    const ownedProducts = await db.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, hsnCode: true },
    });
    const ownedIds = new Set(ownedProducts.map((p) => p.id));
    if (!productIds.every((id) => ownedIds.has(id))) {
      return { message: "One or more selected products are invalid." };
    }
    for (const p of ownedProducts) hsnByProductId.set(p.id, p.hsnCode);
  }

  const invoiceDateObj = new Date(invoiceDate);
  const isInterState = isInterStateSupply(tenant.state, party.state);
  const totals = computeInvoiceTotals(items, { billDiscountPercent, isInterState });

  if (amountPaid > totals.totalAmount) {
    return { errors: { amountPaid: ["Amount paid can't exceed the invoice total."] } };
  }

  const paymentStatus = amountPaid <= 0 ? "UNPAID" : amountPaid >= totals.totalAmount ? "PAID" : "PARTIAL";

  const invoice = await db.$transaction(async (tx) => {
    const invoiceNumber = await getNextInvoiceNumber(tx, context.tenantId, "SALES", invoiceDateObj);

    const created = await tx.invoice.create({
      data: {
        tenantId: context.tenantId,
        type: "SALES",
        invoiceNumber,
        invoiceDate: invoiceDateObj,
        partyId,
        subtotal: totals.subtotal,
        discountAmount: totals.discountAmount,
        taxableAmount: totals.taxableAmount,
        cgstAmount: totals.cgstAmount,
        sgstAmount: totals.sgstAmount,
        igstAmount: totals.igstAmount,
        roundOff: totals.roundOff,
        totalAmount: totals.totalAmount,
        amountPaid,
        paymentStatus,
        notes: notes || null,
        createdByUserId: context.userId,
        items: {
          create: items.map((item, i) => ({
            tenantId: context.tenantId,
            productId: item.productId || null,
            hsnCode: item.productId ? (hsnByProductId.get(item.productId) ?? null) : null,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            rate: item.rate,
            discountPercent: item.discountPercent,
            discountAmount: totals.lines[i].discountAmount,
            gstRate: item.gstRate,
            cgstAmount: totals.lines[i].cgstAmount,
            sgstAmount: totals.lines[i].sgstAmount,
            igstAmount: totals.lines[i].igstAmount,
            taxableAmount: totals.lines[i].taxableAmount,
            totalAmount: totals.lines[i].totalAmount,
          })),
        },
      },
    });

    if (amountPaid > 0) {
      await tx.payment.create({
        data: {
          tenantId: context.tenantId,
          invoiceId: created.id,
          partyId,
          amount: amountPaid,
          mode: paymentMode,
        },
      });
    }

    for (const item of items) {
      if (item.productId) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQty: { decrement: item.quantity } },
        });
      }
    }

    return created;
  });

  revalidatePath("/dashboard/invoices");
  redirect(`/dashboard/invoices/${invoice.id}`);
}
