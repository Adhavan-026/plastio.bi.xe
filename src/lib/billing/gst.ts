import "server-only";
import { Prisma } from "@/generated/prisma/client";

const { Decimal } = Prisma;
type DecimalT = InstanceType<typeof Decimal>;

// All money math runs through Decimal (decimal.js) instead of native
// numbers to avoid floating-point drift — GST rounding bugs are the
// fastest way to lose a shopkeeper's trust.

export type BillingLineInput = {
  quantity: number;
  rate: number;
  discountPercent?: number;
  gstRate: number;
};

export type BillingLineResult = {
  taxableAmount: number;
  discountAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
};

export type InvoiceTotals = {
  lines: BillingLineResult[];
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  roundOff: number;
  totalAmount: number;
};

export type ComputeOptions = {
  /** Bill-level discount %, applied on top of each line's item discount. */
  billDiscountPercent?: number;
  /** true when the party is in a different state than the shop -> IGST instead of CGST+SGST. */
  isInterState: boolean;
};

export function computeInvoiceTotals(
  items: BillingLineInput[],
  options: ComputeOptions
): InvoiceTotals {
  const billDiscountPercent = new Decimal(options.billDiscountPercent ?? 0);

  const lines: BillingLineResult[] = [];
  let subtotal = new Decimal(0);
  let totalDiscount = new Decimal(0);
  let totalTaxable = new Decimal(0);
  let totalCgst = new Decimal(0);
  let totalSgst = new Decimal(0);
  let totalIgst = new Decimal(0);
  let grandTotal = new Decimal(0);

  for (const item of items) {
    const qty = new Decimal(item.quantity);
    const rate = new Decimal(item.rate);
    const lineGross = qty.times(rate);
    subtotal = subtotal.plus(lineGross);

    const itemDiscountPercent = new Decimal(item.discountPercent ?? 0);
    const itemDiscount = lineGross.times(itemDiscountPercent).div(100);
    const afterItemDiscount = lineGross.minus(itemDiscount);

    // Bill-level discount is applied proportionally on top of the item discount.
    const billDiscount = afterItemDiscount.times(billDiscountPercent).div(100);
    const taxable = afterItemDiscount.minus(billDiscount);
    const lineDiscount = itemDiscount.plus(billDiscount);

    const gstRate = new Decimal(item.gstRate);
    const gstAmount = taxable.times(gstRate).div(100);

    let cgst = new Decimal(0);
    let sgst = new Decimal(0);
    let igst = new Decimal(0);
    if (options.isInterState) {
      igst = gstAmount;
    } else {
      cgst = gstAmount.div(2);
      sgst = gstAmount.div(2);
    }

    const lineTotal = taxable.plus(cgst).plus(sgst).plus(igst);

    lines.push({
      taxableAmount: round2(taxable),
      discountAmount: round2(lineDiscount),
      cgstAmount: round2(cgst),
      sgstAmount: round2(sgst),
      igstAmount: round2(igst),
      totalAmount: round2(lineTotal),
    });

    totalDiscount = totalDiscount.plus(lineDiscount);
    totalTaxable = totalTaxable.plus(taxable);
    totalCgst = totalCgst.plus(cgst);
    totalSgst = totalSgst.plus(sgst);
    totalIgst = totalIgst.plus(igst);
    grandTotal = grandTotal.plus(lineTotal);
  }

  // Round the final payable amount to the nearest rupee, the standard
  // Indian retail convention, and surface the difference as roundOff.
  const roundedTotal = grandTotal.toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
  const roundOff = roundedTotal.minus(grandTotal);

  return {
    lines,
    subtotal: round2(subtotal),
    discountAmount: round2(totalDiscount),
    taxableAmount: round2(totalTaxable),
    cgstAmount: round2(totalCgst),
    sgstAmount: round2(totalSgst),
    igstAmount: round2(totalIgst),
    roundOff: round2(roundOff),
    totalAmount: round2(roundedTotal),
  };
}

export function isInterStateSupply(tenantState: string | null, partyState: string | null): boolean {
  if (!tenantState || !partyState) return false;
  return tenantState.trim().toLowerCase() !== partyState.trim().toLowerCase();
}

function round2(value: DecimalT): number {
  return value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
}
