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
  InvoiceEditFormSchema,
  type SalesInvoiceFormState,
} from "@/lib/validations/invoice";
import { canEditInvoice } from "@/lib/billing/invoice-edit";
import type { Role, PartyType } from "@/generated/prisma/enums";

type InvoiceKind = "SALES" | "PURCHASE";

const KIND_CONFIG: Record<
  InvoiceKind,
  {
    allowedRoles: Role[];
    validPartyTypes: PartyType[];
    stockDirection: "increment" | "decrement";
    partyErrorMessage: string;
  }
> = {
  SALES: {
    allowedRoles: ["OWNER", "MANAGER", "CASHIER"],
    validPartyTypes: ["CUSTOMER", "BOTH"],
    stockDirection: "decrement",
    partyErrorMessage: "Select a valid customer.",
  },
  PURCHASE: {
    allowedRoles: ["OWNER", "MANAGER"],
    validPartyTypes: ["SUPPLIER", "BOTH"],
    stockDirection: "increment",
    partyErrorMessage: "Select a valid supplier.",
  },
};

async function createInvoiceCore(
  kind: InvoiceKind,
  formData: FormData
): Promise<SalesInvoiceFormState> {
  const config = KIND_CONFIG[kind];
  const context = await getTenantContext();
  requireRole(context, config.allowedRoles);

  const validatedFields = SalesInvoiceFormSchema.safeParse(Object.fromEntries(formData));
  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const {
    partyId,
    invoiceDate,
    notes,
    billDiscountPercent,
    amountPaid,
    paymentMode,
    itemsJson,
    vehicleNumber,
    vehicleType,
    exchangeValue,
  } = validatedFields.data;

  let rawItems: unknown;
  try {
    rawItems = JSON.parse(itemsJson);
  } catch {
    return { errors: { itemsJson: ["Invalid item data."] } };
  }

  const itemsResult = z
    .array(InvoiceLineSchema)
    .min(1, { error: "Add at least one item." })
    .safeParse(rawItems);
  if (!itemsResult.success) {
    return { errors: { itemsJson: ["One or more items are invalid."] } };
  }
  const items = itemsResult.data;

  const db = await getTenantDb();

  const [tenant, party] = await Promise.all([
    prisma.tenant.findUniqueOrThrow({ where: { id: context.tenantId } }),
    db.party.findUnique({ where: { id: partyId } }),
  ]);

  if (!party || !config.validPartyTypes.includes(party.type)) {
    return { errors: { partyId: [config.partyErrorMessage] } };
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

  // Agro module: batches must belong to this tenant AND to the product the line references.
  const batchIds = items.map((item) => item.batchId).filter((id): id is string => !!id);
  if (batchIds.length > 0) {
    const ownedBatches = await db.stockBatch.findMany({
      where: { id: { in: batchIds } },
      select: { id: true, productId: true },
    });
    const batchById = new Map(ownedBatches.map((b) => [b.id, b.productId]));
    const allValid = items.every(
      (item) => !item.batchId || batchById.get(item.batchId) === item.productId
    );
    if (!allValid) {
      return { message: "One or more selected batches are invalid." };
    }
  }

  const invoiceDateObj = new Date(invoiceDate);
  const isInterState = isInterStateSupply(tenant.state, party.state);
  const totals = computeInvoiceTotals(items, { billDiscountPercent, isInterState });

  // Tyre module: old-tyre exchange value is a straight, untaxed deduction from the bill.
  const netTotal = totals.totalAmount - exchangeValue;
  if (netTotal < 0) {
    return { errors: { exchangeValue: ["Exchange value can't exceed the bill total."] } };
  }

  if (amountPaid > netTotal) {
    return { errors: { amountPaid: ["Amount paid can't exceed the invoice total."] } };
  }

  const paymentStatus = amountPaid <= 0 ? "UNPAID" : amountPaid >= netTotal ? "PAID" : "PARTIAL";

  const invoice = await db.$transaction(async (tx) => {
    const invoiceNumber = await getNextInvoiceNumber(tx, context.tenantId, kind, invoiceDateObj);

    const created = await tx.invoice.create({
      data: {
        tenantId: context.tenantId,
        type: kind,
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
        totalAmount: netTotal,
        amountPaid,
        paymentStatus,
        vehicleNumber: vehicleNumber || null,
        vehicleType: vehicleType || null,
        exchangeValue,
        notes: notes || null,
        createdByUserId: context.userId,
        items: {
          create: items.map((item, i) => ({
            tenantId: context.tenantId,
            productId: item.productId || null,
            hsnCode: item.productId ? (hsnByProductId.get(item.productId) ?? null) : null,
            description: item.description,
            batchId: item.batchId || null,
            tyreSerialNumber: item.tyreSerialNumber || null,
            warrantyMonths: item.warrantyMonths ?? null,
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
          data: { stockQty: { [config.stockDirection]: item.quantity } },
        });
      }
      if (item.batchId && config.stockDirection === "decrement") {
        await tx.stockBatch.update({
          where: { id: item.batchId },
          data: { quantity: { decrement: item.quantity } },
        });
      }
    }

    return created;
  });

  revalidatePath("/dashboard/invoices");
  revalidatePath("/dashboard/purchases");
  redirect(`/dashboard/invoices/${invoice.id}`);
}

export async function createSalesInvoice(
  _state: SalesInvoiceFormState,
  formData: FormData
): Promise<SalesInvoiceFormState> {
  return createInvoiceCore("SALES", formData);
}

export async function createPurchaseInvoice(
  _state: SalesInvoiceFormState,
  formData: FormData
): Promise<SalesInvoiceFormState> {
  return createInvoiceCore("PURCHASE", formData);
}

/**
 * Edits an existing invoice's date/party/items in place: reverses the old
 * stock movements, recomputes GST from scratch, applies the new movements,
 * and keeps the invoice number and recorded payments untouched. Gated by
 * the tenant's owner-controlled allowInvoiceEdit setting + edit window.
 */
export async function updateInvoice(
  invoiceId: string,
  _state: SalesInvoiceFormState,
  formData: FormData
): Promise<SalesInvoiceFormState> {
  const context = await getTenantContext();
  requireRole(context, ["OWNER", "MANAGER"]);

  const db = await getTenantDb();
  const [tenant, existing] = await Promise.all([
    prisma.tenant.findUniqueOrThrow({ where: { id: context.tenantId } }),
    db.invoice.findUnique({ where: { id: invoiceId }, include: { items: true } }),
  ]);

  if (!existing || existing.type === "QUOTATION") {
    return { message: "Invoice not found." };
  }
  if (!canEditInvoice(tenant, existing, context.role)) {
    return {
      message: tenant.allowInvoiceEdit
        ? `This invoice is older than the ${tenant.invoiceEditWindowDays}-day edit window.`
        : "Invoice editing is disabled. The owner can enable it in Settings.",
    };
  }

  const kind: InvoiceKind = existing.type === "PURCHASE" ? "PURCHASE" : "SALES";
  const config = KIND_CONFIG[kind];

  const validatedFields = InvoiceEditFormSchema.safeParse(Object.fromEntries(formData));
  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { partyId, invoiceDate, notes, billDiscountPercent, itemsJson, vehicleNumber, vehicleType, exchangeValue } =
    validatedFields.data;

  let rawItems: unknown;
  try {
    rawItems = JSON.parse(itemsJson);
  } catch {
    return { errors: { itemsJson: ["Invalid item data."] } };
  }
  const itemsResult = z
    .array(InvoiceLineSchema)
    .min(1, { error: "Add at least one item." })
    .safeParse(rawItems);
  if (!itemsResult.success) {
    return { errors: { itemsJson: ["One or more items are invalid."] } };
  }
  const items = itemsResult.data;

  const party = await db.party.findUnique({ where: { id: partyId } });
  if (!party || !config.validPartyTypes.includes(party.type)) {
    return { errors: { partyId: [config.partyErrorMessage] } };
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

  const batchIds = items.map((item) => item.batchId).filter((id): id is string => !!id);
  if (batchIds.length > 0) {
    const ownedBatches = await db.stockBatch.findMany({
      where: { id: { in: batchIds } },
      select: { id: true, productId: true },
    });
    const batchById = new Map(ownedBatches.map((b) => [b.id, b.productId]));
    const allValid = items.every(
      (item) => !item.batchId || batchById.get(item.batchId) === item.productId
    );
    if (!allValid) {
      return { message: "One or more selected batches are invalid." };
    }
  }

  const invoiceDateObj = new Date(invoiceDate);
  const isInterState = isInterStateSupply(tenant.state, party.state);
  const totals = computeInvoiceTotals(items, { billDiscountPercent, isInterState });

  const netTotal = totals.totalAmount - exchangeValue;
  if (netTotal < 0) {
    return { errors: { exchangeValue: ["Exchange value can't exceed the bill total."] } };
  }

  // Payments already recorded stay as they are — the new total can't drop
  // below them, or the books would show an overpaid invoice.
  const amountPaid = Number(existing.amountPaid);
  if (amountPaid > netTotal) {
    return {
      message: `Recorded payments (₹${amountPaid.toFixed(2)}) exceed the new total (₹${netTotal.toFixed(2)}). Adjust items or remove payments first.`,
    };
  }
  const paymentStatus = amountPaid <= 0 ? "UNPAID" : amountPaid >= netTotal ? "PAID" : "PARTIAL";

  await db.$transaction(async (tx) => {
    // Reverse the old stock movements before applying the new ones.
    for (const item of existing.items) {
      if (item.productId) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQty: {
              [config.stockDirection === "decrement" ? "increment" : "decrement"]: item.quantity,
            },
          },
        });
      }
      if (item.batchId && config.stockDirection === "decrement") {
        await tx.stockBatch.update({
          where: { id: item.batchId },
          data: { quantity: { increment: item.quantity } },
        });
      }
    }

    await tx.invoiceItem.deleteMany({ where: { invoiceId } });

    // Note: the invoice number keeps its original financial-year prefix even
    // if the new date crosses an FY boundary — renumbering would break the
    // sequential-numbering audit trail.
    await tx.invoice.update({
      where: { id: invoiceId },
      data: {
        invoiceDate: invoiceDateObj,
        partyId,
        subtotal: totals.subtotal,
        discountAmount: totals.discountAmount,
        taxableAmount: totals.taxableAmount,
        cgstAmount: totals.cgstAmount,
        sgstAmount: totals.sgstAmount,
        igstAmount: totals.igstAmount,
        roundOff: totals.roundOff,
        totalAmount: netTotal,
        paymentStatus,
        vehicleNumber: vehicleNumber || null,
        vehicleType: vehicleType || null,
        exchangeValue,
        notes: notes || null,
        items: {
          create: items.map((item, i) => ({
            tenantId: context.tenantId,
            productId: item.productId || null,
            hsnCode: item.productId ? (hsnByProductId.get(item.productId) ?? null) : null,
            description: item.description,
            batchId: item.batchId || null,
            tyreSerialNumber: item.tyreSerialNumber || null,
            warrantyMonths: item.warrantyMonths ?? null,
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

    for (const item of items) {
      if (item.productId) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQty: { [config.stockDirection]: item.quantity } },
        });
      }
      if (item.batchId && config.stockDirection === "decrement") {
        await tx.stockBatch.update({
          where: { id: item.batchId },
          data: { quantity: { decrement: item.quantity } },
        });
      }
    }
  });

  revalidatePath("/dashboard/invoices");
  revalidatePath("/dashboard/purchases");
  revalidatePath(`/dashboard/invoices/${invoiceId}`);
  redirect(`/dashboard/invoices/${invoiceId}`);
}
