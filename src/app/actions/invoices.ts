"use server";

import * as z from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getTenantDb, getTenantContext, requireRole } from "@/lib/tenant-db";
import { computeInvoiceTotals, isInterStateSupply } from "@/lib/billing/gst";
import {
  getNextInvoiceNumber,
  getFinancialYearKey,
  formatInvoiceNumber,
  splitInvoiceNumber,
  reseedCounter,
  INVOICE_SEQ_MAX,
} from "@/lib/billing/invoice-number";
import {
  InvoiceLineSchema,
  SalesInvoiceFormSchema,
  InvoiceEditFormSchema,
  type SalesInvoiceFormState,
} from "@/lib/validations/invoice";
import { canEditInvoice } from "@/lib/billing/invoice-edit";
import type { Role, PartyType } from "@/lib/enums";

type InvoiceKind = "SALES" | "PURCHASE";

// Production module: RAW/WIP items are stock-only (inputs to a production
// run), not something a shop sells directly — only these categories can go
// on a sales invoice. Purchase bills have no such restriction (a factory
// buys RAW material, a trading shop buys TRADE stock, etc).
const SELLABLE_CATEGORIES = ["FINISHED", "BYPRODUCT", "TRADE"];

// Postgres unique-constraint violation surfaced by Prisma — the only way a
// custom bill number can clash after passing the pre-check (a concurrent
// save grabbed it first).
function isUniqueConstraintError(e: unknown): boolean {
  return typeof e === "object" && e !== null && (e as { code?: unknown }).code === "P2002";
}

/**
 * Validates an owner-gated custom bill-number sequence typed into the form.
 * Returns the parsed sequence, or an error state string when invalid.
 */
function parseCustomSequence(raw: string): number | { error: string } {
  const seq = Number(raw);
  if (!Number.isInteger(seq) || seq < 1 || seq > INVOICE_SEQ_MAX) {
    return { error: `Bill number must be a whole number from 1 to ${INVOICE_SEQ_MAX}.` };
  }
  return seq;
}

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
    invoiceSequence,
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

  if (!party || !config.validPartyTypes.includes(party.type as PartyType)) {
    return { errors: { partyId: [config.partyErrorMessage] } };
  }

  const productIds = items.map((item) => item.productId).filter((id): id is string => !!id);
  const hsnByProductId = new Map<string, string | null>();
  if (productIds.length > 0) {
    const ownedProducts = await db.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, hsnCode: true, stockCategory: true },
    });
    const ownedIds = new Set(ownedProducts.map((p) => p.id));
    if (!productIds.every((id) => ownedIds.has(id))) {
      return { message: "One or more selected products are invalid." };
    }
    for (const p of ownedProducts) hsnByProductId.set(p.id, p.hsnCode);

    if (kind === "SALES") {
      const nonSellable = ownedProducts.find((p) => !SELLABLE_CATEGORIES.includes(p.stockCategory));
      if (nonSellable) {
        return {
          message: `${nonSellable.name} is a raw material / work-in-progress item and can't be sold directly.`,
        };
      }
    }
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

  // Custom bill number: gated exactly like invoice editing — the owner's
  // setting must be on and the caller must be OWNER/MANAGER. The form hides
  // the field otherwise, so anything else arriving here is a forged request.
  let overrideSeq: number | undefined;
  if (invoiceSequence) {
    if (!tenant.allowInvoiceEdit || (context.role !== "OWNER" && context.role !== "MANAGER")) {
      return {
        errors: {
          invoiceSequence: ["Custom bill numbers need invoice editing enabled in Settings."],
        },
      };
    }
    const parsed = parseCustomSequence(invoiceSequence);
    if (typeof parsed !== "number") {
      return { errors: { invoiceSequence: [parsed.error] } };
    }
    const candidate = formatInvoiceNumber(kind, getFinancialYearKey(invoiceDateObj), parsed);
    const clash = await db.invoice.findFirst({
      where: { type: kind, invoiceNumber: candidate },
      select: { id: true },
    });
    if (clash) {
      return { errors: { invoiceSequence: [`${candidate} is already used by another bill.`] } };
    }
    overrideSeq = parsed;
  }

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
    const invoiceNumber = await getNextInvoiceNumber(
      tx,
      context.tenantId,
      kind,
      invoiceDateObj,
      overrideSeq
    );

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
  }).catch((e: unknown) => {
    // A concurrent save can grab a custom number between the pre-check and
    // the insert; surface it as a field error instead of a crash.
    if (overrideSeq !== undefined && isUniqueConstraintError(e)) return null;
    throw e;
  });

  if (!invoice) {
    return {
      errors: { invoiceSequence: ["That bill number was just taken by another bill — try a different one."] },
    };
  }

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
 * and keeps recorded payments untouched. The bill number's sequence can be
 * changed too — the counter is re-seeded forward so future bills continue
 * after it, and existing bills are never renumbered. Gated by the tenant's
 * owner-controlled allowInvoiceEdit setting + edit window.
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

  const {
    partyId,
    invoiceDate,
    notes,
    billDiscountPercent,
    itemsJson,
    vehicleNumber,
    vehicleType,
    exchangeValue,
    invoiceSequence,
  } = validatedFields.data;

  // Renumbering keeps the original TYPE/FY prefix and swaps only the
  // sequence, so the number stays consistent with the counter it came from.
  let newInvoiceNumber: string | undefined;
  let reseed: { counterKey: string; seq: number } | undefined;
  if (invoiceSequence) {
    const parts = splitInvoiceNumber(existing.invoiceNumber);
    if (!parts) {
      return { errors: { invoiceSequence: ["This bill's number format can't be renumbered."] } };
    }
    const parsed = parseCustomSequence(invoiceSequence);
    if (typeof parsed !== "number") {
      return { errors: { invoiceSequence: [parsed.error] } };
    }
    const candidate = `${parts.prefix}${parsed.toString().padStart(4, "0")}`;
    if (candidate !== existing.invoiceNumber) {
      const clash = await db.invoice.findFirst({
        where: { type: existing.type, invoiceNumber: candidate, NOT: { id: invoiceId } },
        select: { id: true },
      });
      if (clash) {
        return { errors: { invoiceSequence: [`${candidate} is already used by another bill.`] } };
      }
      newInvoiceNumber = candidate;
      reseed = { counterKey: parts.counterKey, seq: parsed };
    }
  }

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
  if (!party || !config.validPartyTypes.includes(party.type as PartyType)) {
    return { errors: { partyId: [config.partyErrorMessage] } };
  }

  const productIds = items.map((item) => item.productId).filter((id): id is string => !!id);
  const hsnByProductId = new Map<string, string | null>();
  if (productIds.length > 0) {
    const ownedProducts = await db.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, hsnCode: true, stockCategory: true },
    });
    const ownedIds = new Set(ownedProducts.map((p) => p.id));
    if (!productIds.every((id) => ownedIds.has(id))) {
      return { message: "One or more selected products are invalid." };
    }
    for (const p of ownedProducts) hsnByProductId.set(p.id, p.hsnCode);

    if (kind === "SALES") {
      const nonSellable = ownedProducts.find((p) => !SELLABLE_CATEGORIES.includes(p.stockCategory));
      if (nonSellable) {
        return {
          message: `${nonSellable.name} is a raw material / work-in-progress item and can't be sold directly.`,
        };
      }
    }
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

  const txResult = await db.$transaction(async (tx) => {
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

    // Note: the invoice number keeps its original TYPE/FY prefix even if the
    // new date crosses an FY boundary — only the sequence can be changed,
    // and only through the explicit bill-number field.
    await tx.invoice.update({
      where: { id: invoiceId },
      data: {
        ...(newInvoiceNumber ? { invoiceNumber: newInvoiceNumber } : {}),
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

    // Re-seed the counter so future bills continue after the new number.
    if (reseed) {
      await reseedCounter(tx, context.tenantId, reseed.counterKey, reseed.seq);
    }
  }).catch((e: unknown) => {
    // A concurrent save can grab the new number between the pre-check and
    // the update; surface it as a field error instead of a crash.
    if (newInvoiceNumber && isUniqueConstraintError(e)) return "clash" as const;
    throw e;
  });

  if (txResult === "clash") {
    return {
      errors: { invoiceSequence: ["That bill number was just taken by another bill — try a different one."] },
    };
  }

  revalidatePath("/dashboard/invoices");
  revalidatePath("/dashboard/purchases");
  revalidatePath(`/dashboard/invoices/${invoiceId}`);
  redirect(`/dashboard/invoices/${invoiceId}`);
}
