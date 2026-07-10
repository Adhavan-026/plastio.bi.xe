import Link from "next/link";
import { notFound } from "next/navigation";
import { getTenantContext, getTenantDb } from "@/lib/tenant-db";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { canEditInvoice } from "@/lib/billing/invoice-edit";
import { amountToIndianWords } from "@/lib/billing/number-to-words";
import { GST_STATE_CODES } from "@/lib/validations/gst-state-codes";
import { PrintButton } from "./print-button";
import { RecordPaymentForm } from "./record-payment-form";

// Fixed to the app's light-mode palette on purpose: this sheet represents
// actual printed paper, so it must not flip with the dashboard's dark mode.
const SHEET_VARS = {
  "--paper": "oklch(1 0 0)",
  "--ink": "oklch(0.19 0.03 258)",
  "--ink-soft": "oklch(0.5 0.025 258)",
  "--rule": "oklch(0.8 0.035 260)",
  "--brand": "oklch(0.55 0.215 260)",
  "--brand-ink": "oklch(0.35 0.16 260)",
  "--brand-tint": "oklch(0.94 0.03 260)",
  "--brand-tint-2": "oklch(0.89 0.045 260)",
  "--success": "oklch(0.6 0.135 165)",
  "--success-tint": "oklch(0.94 0.05 165)",
  "--warning": "oklch(0.58 0.15 55)",
  "--warning-tint": "oklch(0.94 0.06 55)",
  "--danger": "oklch(0.55 0.19 25)",
  "--danger-tint": "oklch(0.94 0.06 25)",
} as React.CSSProperties;

function inr(amount: number): string {
  return `₹ ${Math.abs(amount).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function num(amount: number): string {
  return Math.abs(amount).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function stateCode(state: string | null): string | null {
  if (!state) return null;
  return (GST_STATE_CODES as Record<string, string>)[state] ?? null;
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function CellLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[7.4pt] font-semibold tracking-[0.03em] text-[var(--brand-ink)]">
      {children}
    </p>
  );
}

function StatusPill({ status }: { status: "PAID" | "PARTIAL" | "UNPAID" }) {
  const styles = {
    PAID: "bg-[var(--success-tint)] text-[var(--success)]",
    PARTIAL: "bg-[var(--warning-tint)] text-[var(--warning)]",
    UNPAID: "bg-[var(--danger-tint)] text-[var(--danger)]",
  }[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-[8px] py-[1px] text-[7.8pt] font-bold ${styles}`}
    >
      <span className="h-[4px] w-[4px] rounded-full bg-current" />
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { tenantId, role } = await getTenantContext();
  const db = await getTenantDb();

  const [tenant, invoice] = await Promise.all([
    prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } }),
    db.invoice.findUnique({
      where: { id },
      include: {
        party: true,
        items: { include: { batch: { select: { batchNumber: true, expiryDate: true } } } },
        payments: { orderBy: { paymentDate: "asc" } },
      },
    }),
  ]);

  if (!invoice) notFound();

  const balanceDue = Number(invoice.totalAmount) - Number(invoice.amountPaid);
  const isInterState = Number(invoice.igstAmount) > 0;
  const isPurchase = invoice.type === "PURCHASE";
  const docTitle = isPurchase ? "Purchase Bill" : "Tax Invoice";
  const partyLabel = isPurchase ? "Supplier" : "Buyer";
  const hasBatches = invoice.items.some((item) => item.batch);
  const hasTyreInfo = invoice.items.some((item) => item.tyreSerialNumber || item.warrantyMonths);
  const exchangeValue = Number(invoice.exchangeValue);
  const hasVehicle = !!(invoice.vehicleNumber || invoice.vehicleType);
  const totalQty = invoice.items.reduce((sum, item) => sum + Number(item.quantity), 0);
  const totalTax = Number(invoice.cgstAmount) + Number(invoice.sgstAmount) + Number(invoice.igstAmount);

  // GST-return-style breakup: every distinct HSN/rate combination on the
  // invoice, with its own taxable value and tax amount — a real Indian tax
  // invoice is expected to carry this even when items above show one
  // combined total.
  const hsnGroups = new Map<
    string,
    { hsn: string; rate: number; taxable: number; cgst: number; sgst: number; igst: number }
  >();
  for (const item of invoice.items) {
    const hsn = item.hsnCode ?? "—";
    const rate = Number(item.gstRate);
    const key = `${hsn}|${rate}`;
    const group = hsnGroups.get(key) ?? { hsn, rate, taxable: 0, cgst: 0, sgst: 0, igst: 0 };
    group.taxable += Number(item.taxableAmount);
    group.cgst += Number(item.cgstAmount);
    group.sgst += Number(item.sgstAmount);
    group.igst += Number(item.igstAmount);
    hsnGroups.set(key, group);
  }
  const hsnRows = [...hsnGroups.values()].sort((a, b) => a.hsn.localeCompare(b.hsn));

  const tenantCode = stateCode(tenant.state);
  const partyCode = stateCode(invoice.party.state);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end gap-2 print:hidden">
        {invoice.type !== "QUOTATION" && canEditInvoice(tenant, invoice, role) && (
          <Button
            render={<Link href={`/dashboard/invoices/${invoice.id}/edit`} />}
            nativeButton={false}
            variant="outline"
          >
            Edit
          </Button>
        )}
        <Button
          render={<Link href={isPurchase ? "/dashboard/purchases" : "/dashboard/invoices"} />}
          nativeButton={false}
          variant="outline"
        >
          Finish
        </Button>
        <PrintButton />
      </div>

      <div
        className="relative mx-auto flex min-h-[297mm] w-[210mm] flex-col bg-[var(--paper)] px-[10mm] py-[8mm] text-[8.6pt] leading-[1.35] text-[var(--ink)] shadow-lg print:mx-0 print:shadow-none"
        style={SHEET_VARS}
      >
        {/* Title bar */}
        <div className="mb-[4mm] grid grid-cols-3 items-center">
          <div className="flex items-center gap-[2.5mm]">
            {tenant.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- tenant-uploaded data URL, not an optimizable remote asset
              <img
                src={tenant.logoUrl}
                alt=""
                className="h-[8mm] w-[8mm] rounded-[2px] border border-[var(--rule)] bg-white object-contain"
              />
            ) : (
              <span className="flex h-[8mm] w-[8mm] items-center justify-center rounded-[2px] border border-[var(--rule)] bg-[var(--brand-tint)] text-[8pt] font-bold text-[var(--brand-ink)]">
                {getInitials(tenant.name)}
              </span>
            )}
          </div>
          <h1 className="text-center text-[15pt] font-bold text-[var(--brand-ink)]">{docTitle}</h1>
          <p className="text-right text-[7.4pt] font-semibold tracking-[0.05em] text-[var(--ink-soft)] uppercase">
            Original for recipient
          </p>
        </div>

        {/* Seller / buyer / invoice-meta ruled grid */}
        <div className="flex border border-[var(--rule)]">
          <div className="flex w-[58%] flex-col border-r border-[var(--rule)]">
            <div className="border-b border-[var(--rule)] bg-[var(--brand-tint)] px-[3mm] py-[2.6mm]">
              <p className="text-[10pt] font-bold">{tenant.name}</p>
              {tenant.address && <p className="text-[8.4pt]">{tenant.address}</p>}
              <p className="text-[8.4pt]">
                GSTIN/UIN: <span className="font-semibold">{tenant.gstNumber ?? "Unregistered"}</span>
              </p>
              {tenant.state && (
                <p className="text-[8.4pt]">
                  State Name: <span className="font-semibold">{tenant.state}</span>
                  {tenantCode && `, Code: ${tenantCode}`}
                </p>
              )}
              {tenant.licenseNumber && (
                <p className="text-[8.4pt]">
                  License No: <span className="font-semibold">{tenant.licenseNumber}</span>
                </p>
              )}
            </div>
            <div className="flex-1 px-[3mm] py-[2.6mm]">
              <CellLabel>{partyLabel} (Bill to)</CellLabel>
              <p className="mt-[0.8mm] text-[9.5pt] font-bold">{invoice.party.name}</p>
              {invoice.party.address && (
                <p className="text-[8.4pt]">{invoice.party.address}</p>
              )}
              <p className="text-[8.4pt]">
                GSTIN/UIN: <span className="font-semibold">{invoice.party.gstNumber ?? "Unregistered"}</span>
              </p>
              {invoice.party.state && (
                <p className="text-[8.4pt]">
                  State Name: <span className="font-semibold">{invoice.party.state}</span>
                  {partyCode && `, Code: ${partyCode}`}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-1 flex-col">
            <div className="flex border-b border-[var(--rule)]">
              <div className="w-1/2 border-r border-[var(--rule)] px-[3mm] py-[2.6mm]">
                <CellLabel>Invoice No.</CellLabel>
                <p className="mt-[0.8mm] font-mono text-[9.5pt] font-bold">{invoice.invoiceNumber}</p>
              </div>
              <div className="w-1/2 px-[3mm] py-[2.6mm]">
                <CellLabel>Dated</CellLabel>
                <p className="mt-[0.8mm] text-[9.5pt] font-bold">
                  {invoice.invoiceDate
                    .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })
                    .replace(/ /g, "-")}
                </p>
              </div>
            </div>
            <div className="flex border-b border-[var(--rule)]">
              <div className="w-1/2 border-r border-[var(--rule)] px-[3mm] py-[2.6mm]">
                <CellLabel>Payment Status</CellLabel>
                <div className="mt-[1.2mm]">
                  <StatusPill status={invoice.paymentStatus} />
                </div>
              </div>
              <div className="w-1/2 px-[3mm] py-[2.6mm]">
                <CellLabel>{hasVehicle ? "Vehicle No." : "Reverse Charge"}</CellLabel>
                <p className="mt-[0.8mm] text-[8.6pt] font-semibold">
                  {hasVehicle
                    ? [invoice.vehicleNumber, invoice.vehicleType].filter(Boolean).join(" · ")
                    : "N"}
                </p>
              </div>
            </div>
            <div className="flex-1 px-[3mm] py-[2.6mm]">
              <CellLabel>Place of Supply</CellLabel>
              <p className="mt-[0.8mm] text-[8.6pt] font-semibold">
                {invoice.party.state ?? tenant.state ?? "—"} ({isInterState ? "Inter-state" : "Intra-state"})
              </p>
            </div>
          </div>
        </div>

        {/* Items */}
        <table className="w-full border-collapse border border-t-0 border-[var(--rule)] text-[8.2pt]">
          <thead>
            <tr className="bg-[var(--brand-tint-2)] text-[var(--brand-ink)]">
              <th className="border border-[var(--rule)] px-[1.6mm] py-[1.8mm] text-left font-bold">Sl</th>
              <th className="border border-[var(--rule)] px-[1.6mm] py-[1.8mm] text-left font-bold">
                Description of Goods
              </th>
              <th className="border border-[var(--rule)] px-[1.6mm] py-[1.8mm] text-left font-bold">
                HSN/SAC
              </th>
              <th className="border border-[var(--rule)] px-[1.6mm] py-[1.8mm] text-right font-bold">
                Quantity
              </th>
              <th className="border border-[var(--rule)] px-[1.6mm] py-[1.8mm] text-right font-bold">Rate</th>
              <th className="border border-[var(--rule)] px-[1.6mm] py-[1.8mm] text-right font-bold">per</th>
              <th className="border border-[var(--rule)] px-[1.6mm] py-[1.8mm] text-right font-bold">
                Disc.%
              </th>
              <th className="border border-[var(--rule)] px-[1.6mm] py-[1.8mm] text-right font-bold">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, i) => {
              const subParts: string[] = [];
              if (hasBatches && item.batch) {
                subParts.push(`Batch ${item.batch.batchNumber}`);
                if (item.batch.expiryDate) {
                  subParts.push(
                    `Exp ${item.batch.expiryDate.toLocaleDateString("en-IN", { month: "short", year: "numeric" })}`
                  );
                }
              }
              if (hasTyreInfo) {
                if (item.tyreSerialNumber) subParts.push(`Serial ${item.tyreSerialNumber}`);
                if (item.warrantyMonths) subParts.push(`${item.warrantyMonths} mo warranty`);
              }
              return (
                <tr key={item.id}>
                  <td className="border border-[var(--rule)] px-[1.6mm] py-[1.8mm] align-top">
                    {i + 1}
                  </td>
                  <td className="border border-[var(--rule)] px-[1.6mm] py-[1.8mm] align-top">
                    <span className="font-semibold">{item.description}</span>
                    {subParts.length > 0 && (
                      <span className="mt-[0.5mm] block text-[7.6pt] text-[var(--ink-soft)]">
                        {subParts.join(" · ")}
                      </span>
                    )}
                  </td>
                  <td className="border border-[var(--rule)] px-[1.6mm] py-[1.8mm] align-top">
                    {item.hsnCode ?? "—"}
                  </td>
                  <td className="border border-[var(--rule)] px-[1.6mm] py-[1.8mm] text-right align-top font-mono [font-variant-numeric:tabular-nums]">
                    {Number(item.quantity)} {item.unit}
                  </td>
                  <td className="border border-[var(--rule)] px-[1.6mm] py-[1.8mm] text-right align-top font-mono [font-variant-numeric:tabular-nums]">
                    {num(Number(item.rate))}
                  </td>
                  <td className="border border-[var(--rule)] px-[1.6mm] py-[1.8mm] text-right align-top">
                    {item.unit}
                  </td>
                  <td className="border border-[var(--rule)] px-[1.6mm] py-[1.8mm] text-right align-top font-mono [font-variant-numeric:tabular-nums]">
                    {Number(item.discountPercent) > 0 ? `${Number(item.discountPercent)}%` : ""}
                  </td>
                  <td className="border border-[var(--rule)] px-[1.6mm] py-[1.8mm] text-right align-top font-mono [font-variant-numeric:tabular-nums]">
                    {num(Number(item.taxableAmount))}
                  </td>
                </tr>
              );
            })}

            {isInterState ? (
              <tr>
                <td colSpan={7} className="border border-[var(--rule)] px-[1.6mm] py-[1.4mm] text-right italic text-[var(--ink-soft)]">
                  IGST
                </td>
                <td className="border border-[var(--rule)] px-[1.6mm] py-[1.4mm] text-right font-mono [font-variant-numeric:tabular-nums]">
                  {num(Number(invoice.igstAmount))}
                </td>
              </tr>
            ) : (
              <>
                <tr>
                  <td colSpan={7} className="border border-[var(--rule)] px-[1.6mm] py-[1.4mm] text-right italic text-[var(--ink-soft)]">
                    CGST
                  </td>
                  <td className="border border-[var(--rule)] px-[1.6mm] py-[1.4mm] text-right font-mono [font-variant-numeric:tabular-nums]">
                    {num(Number(invoice.cgstAmount))}
                  </td>
                </tr>
                <tr>
                  <td colSpan={7} className="border border-[var(--rule)] px-[1.6mm] py-[1.4mm] text-right italic text-[var(--ink-soft)]">
                    SGST
                  </td>
                  <td className="border border-[var(--rule)] px-[1.6mm] py-[1.4mm] text-right font-mono [font-variant-numeric:tabular-nums]">
                    {num(Number(invoice.sgstAmount))}
                  </td>
                </tr>
              </>
            )}
            {Number(invoice.roundOff) !== 0 && (
              <tr>
                <td colSpan={7} className="border border-[var(--rule)] px-[1.6mm] py-[1.4mm] text-right italic text-[var(--ink-soft)]">
                  Round Off
                </td>
                <td className="border border-[var(--rule)] px-[1.6mm] py-[1.4mm] text-right font-mono [font-variant-numeric:tabular-nums]">
                  {num(Number(invoice.roundOff))}
                </td>
              </tr>
            )}
            {exchangeValue > 0 && (
              <tr>
                <td colSpan={7} className="border border-[var(--rule)] px-[1.6mm] py-[1.4mm] text-right italic text-[var(--ink-soft)]">
                  Less: Old Tyre Exchange
                </td>
                <td className="border border-[var(--rule)] px-[1.6mm] py-[1.4mm] text-right font-mono [font-variant-numeric:tabular-nums]">
                  −{num(exchangeValue)}
                </td>
              </tr>
            )}
            <tr className="bg-[var(--brand-tint)]">
              <td colSpan={3} className="border border-[var(--rule)] px-[1.6mm] py-[2mm] text-right font-bold">
                Total
              </td>
              <td className="border border-[var(--rule)] px-[1.6mm] py-[2mm] text-right font-mono font-bold [font-variant-numeric:tabular-nums]">
                {totalQty} {invoice.items[0]?.unit ?? ""}
              </td>
              <td className="border border-[var(--rule)]" colSpan={3} />
              <td className="border border-[var(--rule)] px-[1.6mm] py-[2mm] text-right font-mono font-bold [font-variant-numeric:tabular-nums]">
                {inr(Number(invoice.totalAmount))}
              </td>
            </tr>
            <tr>
              <td colSpan={7} className="border border-[var(--rule)] px-[1.6mm] py-[1.4mm] text-right text-[var(--ink-soft)]">
                Amount Paid
              </td>
              <td className="border border-[var(--rule)] px-[1.6mm] py-[1.4mm] text-right font-mono [font-variant-numeric:tabular-nums]">
                {num(Number(invoice.amountPaid))}
              </td>
            </tr>
            <tr>
              <td colSpan={7} className="border border-[var(--rule)] px-[1.6mm] py-[1.4mm] text-right font-bold">
                Balance Due
              </td>
              <td
                className="border border-[var(--rule)] px-[1.6mm] py-[1.4mm] text-right font-mono font-bold [font-variant-numeric:tabular-nums]"
                style={{ color: balanceDue > 0 ? "var(--danger)" : "var(--success)" }}
              >
                {num(balanceDue)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Amount chargeable */}
        <div className="flex items-start justify-between border border-t-0 border-[var(--rule)] px-[3mm] py-[2.2mm]">
          <div>
            <p className="text-[7.6pt] text-[var(--ink-soft)]">Amount Chargeable (in words)</p>
            <p className="text-[9pt] font-bold">
              {amountToIndianWords(Number(invoice.totalAmount), "Indian Rupee")}
            </p>
          </div>
          <p className="text-[7.6pt] text-[var(--ink-soft)] italic">E. &amp; O.E</p>
        </div>

        {/* HSN/SAC tax summary */}
        <table className="mt-[3mm] w-full border-collapse border border-[var(--rule)] text-[8pt]">
          <thead>
            <tr className="bg-[var(--brand-tint-2)] text-[var(--brand-ink)]">
              <th rowSpan={2} className="border border-[var(--rule)] px-[1.6mm] py-[1.4mm] font-bold">
                HSN/SAC
              </th>
              <th rowSpan={2} className="border border-[var(--rule)] px-[1.6mm] py-[1.4mm] text-right font-bold">
                Taxable Value
              </th>
              {isInterState ? (
                <th colSpan={2} className="border border-[var(--rule)] px-[1.6mm] py-[1.4mm] font-bold">
                  Integrated Tax
                </th>
              ) : (
                <>
                  <th colSpan={2} className="border border-[var(--rule)] px-[1.6mm] py-[1.4mm] font-bold">
                    Central Tax
                  </th>
                  <th colSpan={2} className="border border-[var(--rule)] px-[1.6mm] py-[1.4mm] font-bold">
                    State Tax
                  </th>
                </>
              )}
              <th rowSpan={2} className="border border-[var(--rule)] px-[1.6mm] py-[1.4mm] text-right font-bold">
                Total Tax Amount
              </th>
            </tr>
            <tr className="bg-[var(--brand-tint-2)] text-[var(--brand-ink)]">
              <th className="border border-[var(--rule)] px-[1.6mm] py-[1mm] text-right font-bold">Rate</th>
              <th className="border border-[var(--rule)] px-[1.6mm] py-[1mm] text-right font-bold">Amount</th>
              {!isInterState && (
                <>
                  <th className="border border-[var(--rule)] px-[1.6mm] py-[1mm] text-right font-bold">Rate</th>
                  <th className="border border-[var(--rule)] px-[1.6mm] py-[1mm] text-right font-bold">Amount</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {hsnRows.map((g) => (
              <tr key={`${g.hsn}-${g.rate}`}>
                <td className="border border-[var(--rule)] px-[1.6mm] py-[1.4mm]">{g.hsn}</td>
                <td className="border border-[var(--rule)] px-[1.6mm] py-[1.4mm] text-right font-mono [font-variant-numeric:tabular-nums]">
                  {num(g.taxable)}
                </td>
                {isInterState ? (
                  <>
                    <td className="border border-[var(--rule)] px-[1.6mm] py-[1.4mm] text-right font-mono [font-variant-numeric:tabular-nums]">
                      {g.rate}%
                    </td>
                    <td className="border border-[var(--rule)] px-[1.6mm] py-[1.4mm] text-right font-mono [font-variant-numeric:tabular-nums]">
                      {num(g.igst)}
                    </td>
                  </>
                ) : (
                  <>
                    <td className="border border-[var(--rule)] px-[1.6mm] py-[1.4mm] text-right font-mono [font-variant-numeric:tabular-nums]">
                      {g.rate / 2}%
                    </td>
                    <td className="border border-[var(--rule)] px-[1.6mm] py-[1.4mm] text-right font-mono [font-variant-numeric:tabular-nums]">
                      {num(g.cgst)}
                    </td>
                    <td className="border border-[var(--rule)] px-[1.6mm] py-[1.4mm] text-right font-mono [font-variant-numeric:tabular-nums]">
                      {g.rate / 2}%
                    </td>
                    <td className="border border-[var(--rule)] px-[1.6mm] py-[1.4mm] text-right font-mono [font-variant-numeric:tabular-nums]">
                      {num(g.sgst)}
                    </td>
                  </>
                )}
                <td className="border border-[var(--rule)] px-[1.6mm] py-[1.4mm] text-right font-mono [font-variant-numeric:tabular-nums]">
                  {num(g.cgst + g.sgst + g.igst)}
                </td>
              </tr>
            ))}
            <tr className="bg-[var(--brand-tint)] font-bold">
              <td className="border border-[var(--rule)] px-[1.6mm] py-[1.4mm]">Total</td>
              <td className="border border-[var(--rule)] px-[1.6mm] py-[1.4mm] text-right font-mono [font-variant-numeric:tabular-nums]">
                {num(Number(invoice.taxableAmount))}
              </td>
              {isInterState ? (
                <>
                  <td className="border border-[var(--rule)]" />
                  <td className="border border-[var(--rule)] px-[1.6mm] py-[1.4mm] text-right font-mono [font-variant-numeric:tabular-nums]">
                    {num(Number(invoice.igstAmount))}
                  </td>
                </>
              ) : (
                <>
                  <td className="border border-[var(--rule)]" />
                  <td className="border border-[var(--rule)] px-[1.6mm] py-[1.4mm] text-right font-mono [font-variant-numeric:tabular-nums]">
                    {num(Number(invoice.cgstAmount))}
                  </td>
                  <td className="border border-[var(--rule)]" />
                  <td className="border border-[var(--rule)] px-[1.6mm] py-[1.4mm] text-right font-mono [font-variant-numeric:tabular-nums]">
                    {num(Number(invoice.sgstAmount))}
                  </td>
                </>
              )}
              <td className="border border-[var(--rule)] px-[1.6mm] py-[1.4mm] text-right font-mono [font-variant-numeric:tabular-nums]">
                {num(totalTax)}
              </td>
            </tr>
          </tbody>
        </table>

        <p className="border border-t-0 border-[var(--rule)] px-[3mm] py-[1.8mm] text-[8pt]">
          <span className="text-[var(--ink-soft)]">Tax Amount (in words): </span>
          <span className="font-bold">{amountToIndianWords(totalTax, "Indian Rupee")}</span>
        </p>

        {invoice.notes && (
          <p className="border border-t-0 border-[var(--rule)] px-[3mm] py-[1.8mm] text-[8pt]">
            <span className="text-[var(--ink-soft)]">Notes: </span>
            {invoice.notes}
          </p>
        )}

        {/* Declaration + signature, pinned to the bottom of the page */}
        <div className="mt-auto flex border border-t-0 border-[var(--rule)]">
          <div className="w-[60%] border-r border-[var(--rule)] px-[3mm] py-[3mm]">
            <p className="mb-[1mm] text-[7.6pt] font-semibold text-[var(--ink-soft)]">Declaration</p>
            <p className="text-[7.6pt] text-[var(--ink-soft)]">
              We declare that this invoice shows the actual price of the goods described and that
              all particulars are true and correct.
            </p>
          </div>
          <div className="flex flex-1 flex-col justify-between px-[3mm] py-[3mm] text-right">
            <p className="text-[8.6pt] font-bold">for {tenant.name}</p>
            <p className="text-[7.8pt] text-[var(--ink-soft)]">Authorised Signatory</p>
          </div>
        </div>
        <p className="pt-[2.5mm] text-center text-[7.6pt] text-[var(--ink-soft)]">
          This is a Computer Generated Invoice
        </p>
      </div>

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 print:hidden">
        <Separator />

        <div>
          <h3 className="mb-2 font-medium">Payments</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.payments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground text-center">
                    No payments recorded yet.
                  </TableCell>
                </TableRow>
              )}
              {invoice.payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{payment.paymentDate.toLocaleDateString("en-IN")}</TableCell>
                  <TableCell>{payment.mode}</TableCell>
                  <TableCell>{payment.reference ?? "—"}</TableCell>
                  <TableCell className="text-right">₹{Number(payment.amount).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {balanceDue > 0 && <RecordPaymentForm invoiceId={invoice.id} balanceDue={balanceDue} />}
      </div>
    </div>
  );
}
