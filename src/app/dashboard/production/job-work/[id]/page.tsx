import Link from "next/link";
import { notFound } from "next/navigation";
import { getTenantContext, getTenantDb } from "@/lib/tenant-db";
import { prisma } from "@/lib/prisma";
import { BackButton } from "@/components/dashboard/back-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PrintButton } from "../../../invoices/[id]/print-button";
import { InwardReturnForm } from "./inward-return-form";

const SHEET_VARS = {
  "--paper": "oklch(1 0 0)",
  "--ink": "oklch(0.19 0.03 258)",
  "--ink-soft": "oklch(0.5 0.025 258)",
  "--rule": "oklch(0.8 0.035 260)",
  "--brand-tint": "oklch(0.94 0.03 260)",
  "--brand-ink": "oklch(0.35 0.16 260)",
} as React.CSSProperties;

const STATUS_VARIANT: Record<string, "warning" | "secondary" | "success"> = {
  OPEN: "warning",
  PARTIALLY_RETURNED: "secondary",
  CLOSED: "success",
};

export default async function JobWorkChallanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { tenantId } = await getTenantContext();
  const db = await getTenantDb();

  const [tenant, challan] = await Promise.all([
    prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } }),
    db.jobWorkChallan.findUnique({
      where: { id },
      include: {
        party: true,
        lines: { include: { product: { select: { name: true, hsnCode: true, unit: true, purchasePrice: true } } } },
      },
    }),
  ]);
  if (!challan) notFound();

  const isOutward = challan.direction === "OUTWARD";

  const [returns, products] = await Promise.all([
    isOutward
      ? db.jobWorkChallan.findMany({
          where: { linkedChallanId: challan.id },
          include: { lines: { include: { product: { select: { name: true, unit: true } } } } },
          orderBy: { date: "asc" },
        })
      : Promise.resolve([]),
    isOutward
      ? db.product.findMany({ where: { isActive: true }, select: { id: true, name: true, unit: true }, orderBy: { name: "asc" } })
      : Promise.resolve([]),
  ]);

  const linkedOutward = !isOutward && challan.linkedChallanId
    ? await db.jobWorkChallan.findUnique({ where: { id: challan.linkedChallanId }, select: { id: true, challanNumber: true } })
    : null;

  const approxTotal = challan.lines.reduce((sum, l) => sum + Number(l.qty) * Number(l.product.purchasePrice), 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2 print:hidden">
        <BackButton />
        <div className="flex items-center gap-2">
          <Badge variant={isOutward ? STATUS_VARIANT[challan.status] : "secondary"}>
            {isOutward ? challan.status.replace("_", " ") : "Return record"}
          </Badge>
          <PrintButton />
        </div>
      </div>

      <div
        className="relative mx-auto flex min-h-[148mm] w-[210mm] flex-col bg-[var(--paper)] px-[10mm] py-[8mm] text-[8.6pt] leading-[1.35] text-[var(--ink)] shadow-lg print:mx-0 print:shadow-none"
        style={SHEET_VARS}
      >
        <div className="mb-[4mm] flex items-center justify-between">
          <h1 className="text-[15pt] font-bold text-[var(--brand-ink)]">
            {isOutward ? "DELIVERY CHALLAN — JOB WORK" : "RETURN CHALLAN — JOB WORK"}
          </h1>
          <p className="text-right text-[7.4pt] font-semibold tracking-[0.05em] text-[var(--ink-soft)] uppercase">
            Not for sale
          </p>
        </div>

        <div className="flex border border-[var(--rule)]">
          <div className="w-[58%] border-r border-[var(--rule)] px-[3mm] py-[2.6mm]">
            <p className="text-[7.4pt] font-semibold text-[var(--brand-ink)]">From</p>
            <p className="text-[10pt] font-bold">{tenant.name}</p>
            {tenant.address && <p className="text-[8.4pt]">{tenant.address}</p>}
            {tenant.gstNumber && <p className="text-[8.4pt]">GSTIN: {tenant.gstNumber}</p>}
            <p className="mt-[2mm] text-[7.4pt] font-semibold text-[var(--brand-ink)]">Job worker</p>
            <p className="text-[9.5pt] font-bold">{challan.party.name}</p>
            {challan.party.address && <p className="text-[8.4pt]">{challan.party.address}</p>}
            {challan.party.gstNumber && <p className="text-[8.4pt]">GSTIN: {challan.party.gstNumber}</p>}
          </div>
          <div className="flex flex-1 flex-col">
            <div className="border-b border-[var(--rule)] px-[3mm] py-[2.6mm]">
              <p className="text-[7.4pt] font-semibold text-[var(--brand-ink)]">Challan No.</p>
              <p className="font-mono text-[9.5pt] font-bold">{challan.challanNumber}</p>
            </div>
            <div className="border-b border-[var(--rule)] px-[3mm] py-[2.6mm]">
              <p className="text-[7.4pt] font-semibold text-[var(--brand-ink)]">Date</p>
              <p className="text-[9.5pt] font-bold">{challan.date.toLocaleDateString("en-IN")}</p>
            </div>
            {isOutward && challan.expectedReturnDate && (
              <div className="px-[3mm] py-[2.6mm]">
                <p className="text-[7.4pt] font-semibold text-[var(--brand-ink)]">Expected return</p>
                <p className="text-[8.6pt] font-semibold">{challan.expectedReturnDate.toLocaleDateString("en-IN")}</p>
              </div>
            )}
          </div>
        </div>

        <table className="w-full border-collapse border border-t-0 border-[var(--rule)] text-[8.2pt]">
          <thead>
            <tr className="bg-[var(--brand-tint)] text-[var(--brand-ink)]">
              <th className="border border-[var(--rule)] px-[1.6mm] py-[1.8mm] text-left font-bold">Description</th>
              <th className="border border-[var(--rule)] px-[1.6mm] py-[1.8mm] text-left font-bold">HSN</th>
              <th className="border border-[var(--rule)] px-[1.6mm] py-[1.8mm] text-right font-bold">Qty</th>
              <th className="border border-[var(--rule)] px-[1.6mm] py-[1.8mm] text-right font-bold">Approx. value</th>
            </tr>
          </thead>
          <tbody>
            {challan.lines.map((line) => (
              <tr key={line.id}>
                <td className="border border-[var(--rule)] px-[1.6mm] py-[1.8mm]">
                  {line.product.name}
                  {line.description && (
                    <span className="mt-[0.5mm] block text-[7.6pt] text-[var(--ink-soft)]">{line.description}</span>
                  )}
                </td>
                <td className="border border-[var(--rule)] px-[1.6mm] py-[1.8mm]">{line.product.hsnCode ?? "—"}</td>
                <td className="border border-[var(--rule)] px-[1.6mm] py-[1.8mm] text-right font-mono">
                  {Number(line.qty)} {line.product.unit}
                </td>
                <td className="border border-[var(--rule)] px-[1.6mm] py-[1.8mm] text-right font-mono">
                  ₹{(Number(line.qty) * Number(line.product.purchasePrice)).toFixed(2)}
                </td>
              </tr>
            ))}
            <tr className="bg-[var(--brand-tint)] font-bold">
              <td colSpan={3} className="border border-[var(--rule)] px-[1.6mm] py-[2mm] text-right">
                Total (approx.)
              </td>
              <td className="border border-[var(--rule)] px-[1.6mm] py-[2mm] text-right font-mono">
                ₹{approxTotal.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>

        {challan.notes && (
          <p className="border border-t-0 border-[var(--rule)] px-[3mm] py-[1.8mm] text-[8pt]">
            <span className="text-[var(--ink-soft)]">Notes: </span>
            {challan.notes}
          </p>
        )}

        <p className="mt-auto pt-[3mm] text-center text-[7.6pt] font-semibold text-[var(--ink-soft)]">
          {isOutward
            ? "Not for sale — goods sent for job work"
            : `Return against outward challan ${linkedOutward?.challanNumber ?? ""}`}
        </p>
      </div>

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 print:hidden">
        {!isOutward && linkedOutward && (
          <p className="text-muted-foreground text-sm">
            Returned against{" "}
            <Link href={`/dashboard/production/job-work/${linkedOutward.id}`} className="underline underline-offset-4">
              {linkedOutward.challanNumber}
            </Link>
          </p>
        )}

        {isOutward && returns.length > 0 && (
          <>
            <Separator />
            <div>
              <h3 className="mb-2 font-medium">Returns received</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Challan #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Items</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {returns.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <Link href={`/dashboard/production/job-work/${r.id}`} className="underline underline-offset-4">
                          {r.challanNumber}
                        </Link>
                      </TableCell>
                      <TableCell>{r.date.toLocaleDateString("en-IN")}</TableCell>
                      <TableCell>
                        {r.lines.map((l) => `${l.product.name} (${Number(l.qty)} ${l.product.unit})`).join(", ")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}

        {isOutward && challan.status !== "CLOSED" && (
          <>
            <Separator />
            <Card>
              <CardHeader>
                <CardTitle>Record a return</CardTitle>
              </CardHeader>
              <CardContent>
                <InwardReturnForm outwardChallanId={challan.id} products={products} />
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
