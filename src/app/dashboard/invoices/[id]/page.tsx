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
import { PrintButton } from "./print-button";
import { RecordPaymentForm } from "./record-payment-form";

// Fixed to the app's light-mode palette on purpose: this sheet represents
// actual printed paper, so it must not flip with the dashboard's dark mode.
const SHEET_VARS = {
  "--paper": "oklch(1 0 0)",
  "--ink": "oklch(0.19 0.03 258)",
  "--ink-soft": "oklch(0.5 0.025 258)",
  "--line": "oklch(0.92 0.011 255)",
  "--line-soft": "oklch(0.96 0.006 255)",
  "--brand": "oklch(0.55 0.215 260)",
  "--brand-ink": "oklch(0.35 0.16 260)",
  "--brand-tint": "oklch(0.93 0.035 260)",
  "--success": "oklch(0.6 0.135 165)",
  "--success-tint": "oklch(0.94 0.05 165)",
  "--warning": "oklch(0.58 0.15 55)",
  "--warning-tint": "oklch(0.94 0.06 55)",
  "--danger": "oklch(0.55 0.19 25)",
  "--danger-tint": "oklch(0.94 0.06 25)",
} as React.CSSProperties;

function inr(amount: number): string {
  return `₹${Math.abs(amount).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-[1.4mm] text-[7.6pt] font-bold tracking-[0.1em] text-[var(--ink-soft)] uppercase">
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
      className={`inline-flex items-center gap-1 rounded-full px-[9px] py-[2px] text-[8pt] font-bold tracking-[0.04em] ${styles}`}
    >
      <span className="h-[5px] w-[5px] rounded-full bg-current" />
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
  const docTitle = isPurchase ? "PURCHASE BILL" : "TAX INVOICE";
  const partyLabel = isPurchase ? "Bill from" : "Bill to";
  const hasBatches = invoice.items.some((item) => item.batch);
  const hasTyreInfo = invoice.items.some((item) => item.tyreSerialNumber || item.warrantyMonths);
  const exchangeValue = Number(invoice.exchangeValue);
  const hasVehicle = !!(invoice.vehicleNumber || invoice.vehicleType);

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
        className="relative mx-auto flex min-h-[297mm] w-[210mm] flex-col overflow-hidden bg-[var(--paper)] text-[9.5pt] leading-[1.4] text-[var(--ink)] shadow-lg print:mx-0 print:shadow-none"
        style={SHEET_VARS}
      >
        {/* Original-for-recipient watermark, standard on Indian tax invoice copies */}
        <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
          <span className="-rotate-[26deg] text-[78pt] font-extrabold tracking-[0.06em] whitespace-nowrap text-[var(--brand)] uppercase opacity-[0.045]">
            Original
          </span>
        </div>

        {/* Header band */}
        <div className="relative z-10 flex items-start justify-between gap-[10mm] bg-[var(--brand)] px-[14mm] pt-[11mm] pb-[9mm] text-white">
          <div className="flex gap-[3mm]">
            <div className="flex h-[9mm] w-[9mm] shrink-0 items-center justify-center overflow-hidden rounded-[3px] border border-white/30 bg-white/15 text-[10pt] font-extrabold">
              {tenant.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- tenant-uploaded data URL, not an optimizable remote asset
                <img
                  src={tenant.logoUrl}
                  alt=""
                  className="h-full w-full bg-white object-contain"
                />
              ) : (
                getInitials(tenant.name)
              )}
            </div>
            <div>
              <p className="mb-[1.5mm] text-[15.5pt] font-extrabold text-balance">{tenant.name}</p>
              {tenant.address && (
                <p className="mt-[0.6mm] text-[8.5pt] text-white/80">{tenant.address}</p>
              )}
              <p className="mt-[0.6mm] text-[8.5pt] text-white/80">
                {tenant.gstNumber && (
                  <>
                    <span className="font-semibold text-white">GSTIN</span> {tenant.gstNumber}
                    {tenant.phone && " · "}
                  </>
                )}
                {tenant.phone}
              </p>
              {tenant.licenseNumber && (
                <p className="mt-[0.6mm] text-[8.5pt] text-white/80">
                  <span className="font-semibold text-white">License</span> {tenant.licenseNumber}
                </p>
              )}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="mb-[1.5mm] text-[8.5pt] font-bold tracking-[0.14em] text-white/75 uppercase">
              {docTitle}
            </p>
            <p className="font-mono text-[13.5pt] font-bold">{invoice.invoiceNumber}</p>
            <p className="mt-[2mm] text-[8.5pt] text-white/80">
              <span className="text-white/60">Date </span>
              {invoice.invoiceDate.toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Bill-to / status meta strip */}
        <div className="relative z-10 grid grid-cols-[1fr_76mm] gap-[10mm] border-b border-[var(--line)] px-[14mm] py-[8mm]">
          <div>
            <FieldLabel>{partyLabel}</FieldLabel>
            <p className="mb-[1mm] text-[11.5pt] font-bold">{invoice.party.name}</p>
            {invoice.party.address && (
              <p className="mt-[0.5mm] text-[9pt] text-[var(--ink-soft)]">
                {invoice.party.address}
              </p>
            )}
            <p className="mt-[0.5mm] text-[9pt] text-[var(--ink-soft)]">
              {invoice.party.phone && (
                <>
                  <span className="font-semibold text-[var(--ink)]">{invoice.party.phone}</span>
                  {" · "}
                </>
              )}
              GSTIN: {invoice.party.gstNumber ?? "Unregistered"}
            </p>
          </div>
          <div className="overflow-hidden rounded-[4px] border border-[var(--line)]">
            <div className="flex items-center justify-between bg-[var(--brand-tint)] px-[4mm] py-[3.5mm]">
              <span className="text-[7.6pt] font-bold tracking-[0.08em] text-[var(--brand-ink)] uppercase">
                Balance due
              </span>
              <span className="font-mono text-[13pt] font-bold text-[var(--brand-ink)]">
                {inr(balanceDue)}
              </span>
            </div>
            <div className="grid grid-cols-2">
              <div className="p-[3mm]">
                <FieldLabel>Status</FieldLabel>
                <StatusPill status={invoice.paymentStatus} />
              </div>
              <div className="border-l border-[var(--line)] p-[3mm]">
                <FieldLabel>{hasVehicle ? "Vehicle" : "Payment terms"}</FieldLabel>
                <p className="text-[9pt] font-semibold">
                  {hasVehicle
                    ? [invoice.vehicleNumber, invoice.vehicleType].filter(Boolean).join(" · ")
                    : "Due on receipt"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="relative z-10 px-[14mm]">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="bg-[var(--brand-tint)] py-[3mm] pr-[2.4mm] pl-[3mm] text-left text-[7.4pt] font-bold tracking-[0.05em] text-[var(--brand-ink)] uppercase">
                  #
                </th>
                <th className="bg-[var(--brand-tint)] px-[2.4mm] py-[3mm] text-left text-[7.4pt] font-bold tracking-[0.05em] text-[var(--brand-ink)] uppercase">
                  Item
                </th>
                <th className="bg-[var(--brand-tint)] px-[2.4mm] py-[3mm] text-right text-[7.4pt] font-bold tracking-[0.05em] text-[var(--brand-ink)] uppercase">
                  Qty
                </th>
                <th className="bg-[var(--brand-tint)] px-[2.4mm] py-[3mm] text-right text-[7.4pt] font-bold tracking-[0.05em] text-[var(--brand-ink)] uppercase">
                  Rate
                </th>
                <th className="bg-[var(--brand-tint)] px-[2.4mm] py-[3mm] text-right text-[7.4pt] font-bold tracking-[0.05em] text-[var(--brand-ink)] uppercase">
                  Disc
                </th>
                <th className="bg-[var(--brand-tint)] px-[2.4mm] py-[3mm] text-right text-[7.4pt] font-bold tracking-[0.05em] text-[var(--brand-ink)] uppercase">
                  Taxable
                </th>
                {isInterState ? (
                  <th className="bg-[var(--brand-tint)] px-[2.4mm] py-[3mm] text-right text-[7.4pt] font-bold tracking-[0.05em] text-[var(--brand-ink)] uppercase">
                    IGST
                  </th>
                ) : (
                  <>
                    <th className="bg-[var(--brand-tint)] px-[2.4mm] py-[3mm] text-right text-[7.4pt] font-bold tracking-[0.05em] text-[var(--brand-ink)] uppercase">
                      CGST
                    </th>
                    <th className="bg-[var(--brand-tint)] px-[2.4mm] py-[3mm] text-right text-[7.4pt] font-bold tracking-[0.05em] text-[var(--brand-ink)] uppercase">
                      SGST
                    </th>
                  </>
                )}
                <th className="bg-[var(--brand-tint)] px-[2.4mm] py-[3mm] text-right text-[7.4pt] font-bold tracking-[0.05em] text-[var(--brand-ink)] uppercase">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, i) => {
                const subParts: string[] = [];
                if (item.hsnCode) subParts.push(`HSN ${item.hsnCode}`);
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
                  <tr key={item.id} className={i % 2 === 1 ? "bg-[#fafbfe]" : undefined}>
                    <td className="border-b border-[var(--line-soft)] py-[3mm] pr-[2.4mm] pl-[3mm] align-top text-[var(--ink-soft)]">
                      {i + 1}
                    </td>
                    <td className="border-b border-[var(--line-soft)] px-[2.4mm] py-[3mm] align-top">
                      <span className="font-semibold">{item.description}</span>
                      {subParts.length > 0 && (
                        <span className="mt-[0.8mm] block text-[7.8pt] font-normal text-[var(--ink-soft)]">
                          {subParts.join(" · ")}
                        </span>
                      )}
                    </td>
                    <td className="border-b border-[var(--line-soft)] px-[2.4mm] py-[3mm] text-right align-top font-mono [font-variant-numeric:tabular-nums]">
                      {Number(item.quantity)} {item.unit}
                    </td>
                    <td className="border-b border-[var(--line-soft)] px-[2.4mm] py-[3mm] text-right align-top font-mono [font-variant-numeric:tabular-nums]">
                      {Number(item.rate).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="border-b border-[var(--line-soft)] px-[2.4mm] py-[3mm] text-right align-top font-mono [font-variant-numeric:tabular-nums]">
                      {Number(item.discountAmount).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="border-b border-[var(--line-soft)] px-[2.4mm] py-[3mm] text-right align-top font-mono [font-variant-numeric:tabular-nums]">
                      {Number(item.taxableAmount).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    {isInterState ? (
                      <td className="border-b border-[var(--line-soft)] px-[2.4mm] py-[3mm] text-right align-top font-mono [font-variant-numeric:tabular-nums]">
                        {Number(item.igstAmount).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                    ) : (
                      <>
                        <td className="border-b border-[var(--line-soft)] px-[2.4mm] py-[3mm] text-right align-top font-mono [font-variant-numeric:tabular-nums]">
                          {Number(item.cgstAmount).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="border-b border-[var(--line-soft)] px-[2.4mm] py-[3mm] text-right align-top font-mono [font-variant-numeric:tabular-nums]">
                          {Number(item.sgstAmount).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                      </>
                    )}
                    <td className="border-b border-[var(--line-soft)] px-[2.4mm] py-[3mm] text-right align-top font-mono [font-variant-numeric:tabular-nums]">
                      {Number(item.totalAmount).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Amount in words / notes + totals stub */}
        <div className="relative z-10 flex items-start gap-[10mm] px-[14mm] pt-[7mm]">
          <div className="flex flex-1 flex-col gap-[5mm]">
            <div className="rounded-[4px] border border-[var(--line-soft)] bg-[#fbfbfd] px-[4mm] py-[3mm]">
              <FieldLabel>Amount in words</FieldLabel>
              <p className="text-[9pt]">{amountToIndianWords(Number(invoice.totalAmount))}</p>
            </div>
            {invoice.notes && (
              <div className="rounded-[4px] border border-[var(--line-soft)] bg-[#fbfbfd] px-[4mm] py-[3mm]">
                <FieldLabel>Notes</FieldLabel>
                <p className="text-[9pt]">{invoice.notes}</p>
              </div>
            )}
          </div>
          <div className="w-[76mm] shrink-0 overflow-hidden rounded-[4px] border border-[var(--line)]">
            <div className="flex justify-between px-[4mm] py-[2.4mm] text-[8.8pt]">
              <span className="text-[var(--ink-soft)]">Subtotal</span>
              <span className="font-mono [font-variant-numeric:tabular-nums]">
                {inr(Number(invoice.subtotal))}
              </span>
            </div>
            <div className="flex justify-between px-[4mm] py-[2.4mm] text-[8.8pt]">
              <span className="text-[var(--ink-soft)]">Discount</span>
              <span className="font-mono [font-variant-numeric:tabular-nums]">
                −{inr(Number(invoice.discountAmount))}
              </span>
            </div>
            <div className="flex justify-between px-[4mm] py-[2.4mm] text-[8.8pt]">
              <span className="text-[var(--ink-soft)]">Taxable amount</span>
              <span className="font-mono [font-variant-numeric:tabular-nums]">
                {inr(Number(invoice.taxableAmount))}
              </span>
            </div>
            {isInterState ? (
              <div className="flex justify-between px-[4mm] py-[2.4mm] text-[8.8pt]">
                <span className="text-[var(--ink-soft)]">IGST</span>
                <span className="font-mono [font-variant-numeric:tabular-nums]">
                  {inr(Number(invoice.igstAmount))}
                </span>
              </div>
            ) : (
              <>
                <div className="flex justify-between px-[4mm] py-[2.4mm] text-[8.8pt]">
                  <span className="text-[var(--ink-soft)]">CGST</span>
                  <span className="font-mono [font-variant-numeric:tabular-nums]">
                    {inr(Number(invoice.cgstAmount))}
                  </span>
                </div>
                <div className="flex justify-between px-[4mm] py-[2.4mm] text-[8.8pt]">
                  <span className="text-[var(--ink-soft)]">SGST</span>
                  <span className="font-mono [font-variant-numeric:tabular-nums]">
                    {inr(Number(invoice.sgstAmount))}
                  </span>
                </div>
              </>
            )}
            <div className="flex justify-between px-[4mm] py-[2.4mm] text-[8.8pt]">
              <span className="text-[var(--ink-soft)]">Round off</span>
              <span className="font-mono [font-variant-numeric:tabular-nums]">
                {inr(Number(invoice.roundOff))}
              </span>
            </div>
            {exchangeValue > 0 && (
              <div className="flex justify-between px-[4mm] py-[2.4mm] text-[8.8pt]">
                <span className="text-[var(--ink-soft)]">Old tyre exchange</span>
                <span className="font-mono [font-variant-numeric:tabular-nums]">
                  −{inr(exchangeValue)}
                </span>
              </div>
            )}
            <div className="mt-[0.5mm] flex justify-between border-t border-[var(--line)] bg-[var(--brand-tint)] px-[4mm] py-[3.2mm]">
              <span className="text-[9.2pt] font-bold text-[var(--brand-ink)]">Grand total</span>
              <span className="font-mono text-[11.5pt] font-bold text-[var(--brand-ink)] [font-variant-numeric:tabular-nums]">
                {inr(Number(invoice.totalAmount))}
              </span>
            </div>
            <div className="flex justify-between border-t border-[var(--line)] px-[4mm] py-[2.4mm] text-[8.8pt]">
              <span className="text-[var(--ink-soft)]">Paid</span>
              <span className="font-mono [font-variant-numeric:tabular-nums]">
                {inr(Number(invoice.amountPaid))}
              </span>
            </div>
            <div className="flex justify-between bg-[var(--line-soft)] px-[4mm] py-[2.4mm] text-[8.8pt] font-bold">
              <span>Balance due</span>
              <span
                className="font-mono [font-variant-numeric:tabular-nums]"
                style={{ color: balanceDue > 0 ? "var(--danger)" : "var(--success)" }}
              >
                {inr(balanceDue)}
              </span>
            </div>
          </div>
        </div>

        {/* Terms + signature, pinned to the bottom of the page */}
        <div className="relative z-10 mt-auto grid grid-cols-2 gap-[8mm] border-t border-[var(--line)] px-[14mm] pt-[7mm] pb-[6mm]">
          <div>
            <FieldLabel>Terms</FieldLabel>
            <ul className="list-disc pl-[3.6mm] text-[8.1pt] text-[var(--ink-soft)]">
              <li className="mb-[0.8mm]">Goods once sold are not returnable.</li>
              <li className="mb-[0.8mm]">E. &amp; O.E. (errors and omissions excepted).</li>
              <li>Subject to {tenant.state ?? "local"} jurisdiction.</li>
            </ul>
          </div>
          <div className="flex flex-col items-end text-right">
            <p className="mb-[12mm] text-[9pt] font-bold">For {tenant.name}</p>
            <p className="w-[42mm] border-t border-[var(--ink-soft)] pt-[1.6mm] text-[8pt] text-[var(--ink-soft)]">
              Authorised signatory
            </p>
          </div>
        </div>
        <div className="relative z-10 flex justify-between border-t border-[var(--line-soft)] px-[14mm] py-[3mm] text-[7.6pt] tracking-[0.03em] text-[var(--ink-soft)]">
          <span>Original for recipient</span>
          <span>Computer-generated invoice</span>
        </div>
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
