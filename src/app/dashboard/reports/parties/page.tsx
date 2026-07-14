import { getTenantDb } from "@/lib/tenant-db";
import { resolveDateRange } from "@/lib/reports/date-range";
import { DateRangeForm } from "@/components/reports/date-range-form";
import { ExportCsvButton } from "@/components/reports/export-csv-button";
import { PrintReportButton } from "@/components/reports/print-report-button";
import { TopPartiesChart } from "@/components/reports/top-parties-chart";
import { requireActiveSubscription } from "@/lib/billing/subscription";
import { BackButton } from "@/components/dashboard/back-button";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function PartiesReportPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  await requireActiveSubscription();
  const params = await searchParams;
  const { from, to, fromStr, toStr } = resolveDateRange(params);

  const db = await getTenantDb();
  const grouped = await db.invoice.groupBy({
    by: ["partyId"],
    where: { type: "SALES", invoiceDate: { gte: from, lte: to } },
    _sum: { totalAmount: true, amountPaid: true },
    _count: true,
    orderBy: { _sum: { totalAmount: "desc" } },
  });

  const parties = await db.party.findMany({
    where: { id: { in: grouped.map((g) => g.partyId) } },
    select: { id: true, name: true },
  });
  const nameById = new Map(parties.map((p) => [p.id, p.name]));

  const rows = grouped.map((g) => {
    const revenue = Number(g._sum.totalAmount ?? 0);
    const paid = Number(g._sum.amountPaid ?? 0);
    return {
      party: nameById.get(g.partyId) ?? "Unknown",
      invoiceCount: g._count,
      revenue,
      paid,
      due: revenue - paid,
    };
  });

  const grand = rows.reduce(
    (acc, r) => ({ revenue: acc.revenue + r.revenue, paid: acc.paid + r.paid, due: acc.due + r.due }),
    { revenue: 0, paid: 0, due: 0 }
  );

  return (
    <div className="flex flex-col gap-6">
      <BackButton />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Party-wise sales</h1>
        <div className="flex items-center gap-2">
          <PrintReportButton />
          <ExportCsvButton
            rows={rows}
            filename={`party-sales-${fromStr}-to-${toStr}.csv`}
            columns={[
              { key: "party", label: "Party" },
              { key: "invoiceCount", label: "Invoices" },
              { key: "revenue", label: "Revenue" },
              { key: "paid", label: "Paid" },
              { key: "due", label: "Due" },
            ]}
          />
        </div>
      </div>

      <DateRangeForm from={fromStr} to={toStr} />

      <TopPartiesChart rows={rows} />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Party</TableHead>
            <TableHead className="text-right">Invoices</TableHead>
            <TableHead className="text-right">Revenue</TableHead>
            <TableHead className="text-right">Paid</TableHead>
            <TableHead className="text-right">Due</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-muted-foreground text-center">
                No sales in this range.
              </TableCell>
            </TableRow>
          )}
          {rows.map((row) => (
            <TableRow key={row.party}>
              <TableCell className="font-medium">{row.party}</TableCell>
              <TableCell className="text-right">{row.invoiceCount}</TableCell>
              <TableCell className="text-right">₹{row.revenue.toFixed(2)}</TableCell>
              <TableCell className="text-right">₹{row.paid.toFixed(2)}</TableCell>
              <TableCell className={`text-right ${row.due > 0 ? "text-destructive" : ""}`}>
                ₹{row.due.toFixed(2)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        {rows.length > 0 && (
          <TableFooter>
            <TableRow>
              <TableCell className="font-medium">Total</TableCell>
              <TableCell />
              <TableCell className="text-right font-medium">₹{grand.revenue.toFixed(2)}</TableCell>
              <TableCell className="text-right font-medium">₹{grand.paid.toFixed(2)}</TableCell>
              <TableCell className="text-right font-medium">₹{grand.due.toFixed(2)}</TableCell>
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </div>
  );
}
