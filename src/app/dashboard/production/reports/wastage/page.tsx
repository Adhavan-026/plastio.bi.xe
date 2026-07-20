import { getTenantDb } from "@/lib/tenant-db";
import { requireActiveSubscription } from "@/lib/billing/subscription";
import { resolveDateRange } from "@/lib/reports/date-range";
import { DateRangeForm } from "@/components/reports/date-range-form";
import { ExportCsvButton } from "@/components/reports/export-csv-button";
import { PrintReportButton } from "@/components/reports/print-report-button";
import { BackButton } from "@/components/dashboard/back-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function WastageReportPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  await requireActiveSubscription();
  const { from, to, fromStr, toStr } = resolveDateRange(await searchParams, 90);

  const db = await getTenantDb();
  const wastageOutputs = await db.productionOutput.findMany({
    where: { outputType: "WASTAGE", run: { completedAt: { gte: from, lte: to } } },
    include: { product: { select: { name: true, unit: true } }, run: { select: { completedAt: true, inputs: true } } },
  });

  // By item.
  const byItem = new Map<string, { name: string; unit: string; qty: number }>();
  for (const w of wastageOutputs) {
    const existing = byItem.get(w.productId) ?? { name: w.product.name, unit: w.product.unit, qty: 0 };
    existing.qty += Number(w.qty);
    byItem.set(w.productId, existing);
  }
  const byItemRows = [...byItem.values()].sort((a, b) => b.qty - a.qty);

  // By month, with % of that month's total input qty.
  const monthTotals = new Map<string, { wastageQty: number; inputQty: number }>();
  for (const w of wastageOutputs) {
    const d = w.run.completedAt ?? new Date();
    const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
    const entry = monthTotals.get(key) ?? { wastageQty: 0, inputQty: 0 };
    entry.wastageQty += Number(w.qty);
    monthTotals.set(key, entry);
  }
  // Input totals per month, computed from all completed runs (not just those with wastage) in range.
  const allRuns = await db.productionRun.findMany({
    where: { status: "COMPLETED", completedAt: { gte: from, lte: to } },
    include: { inputs: true },
  });
  for (const run of allRuns) {
    const d = run.completedAt ?? new Date();
    const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
    const entry = monthTotals.get(key) ?? { wastageQty: 0, inputQty: 0 };
    entry.inputQty += run.inputs.reduce((sum, i) => sum + Number(i.qty), 0);
    monthTotals.set(key, entry);
  }
  const byMonthRows = [...monthTotals.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([month, v]) => ({
      month,
      wastageQty: v.wastageQty,
      inputQty: v.inputQty,
      wastagePercent: v.inputQty > 0 ? ((v.wastageQty / v.inputQty) * 100).toFixed(1) : "—",
    }));

  return (
    <div className="flex flex-col gap-6">
      <BackButton />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Wastage</h1>
          <p className="text-muted-foreground text-sm">Wastage recorded on completed production runs.</p>
        </div>
        <div className="flex items-center gap-2">
          <PrintReportButton />
          <ExportCsvButton
            rows={byItemRows}
            filename="production-wastage-by-item.csv"
            columns={[
              { key: "name", label: "Item" },
              { key: "unit", label: "Unit" },
              { key: "qty", label: "Wastage qty" },
            ]}
          />
        </div>
      </div>

      <DateRangeForm from={fromStr} to={toStr} />

      <div>
        <h2 className="mb-2 font-medium">By item</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead className="text-right">Wastage qty</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {byItemRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={2} className="text-muted-foreground text-center">
                  No wastage recorded in this period.
                </TableCell>
              </TableRow>
            )}
            {byItemRows.map((row) => (
              <TableRow key={row.name}>
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.qty} {row.unit}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div>
        <h2 className="mb-2 font-medium">By month</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Month</TableHead>
              <TableHead className="text-right">Input qty</TableHead>
              <TableHead className="text-right">Wastage qty</TableHead>
              <TableHead className="text-right">Wastage %</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {byMonthRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground text-center">
                  No completed runs in this period.
                </TableCell>
              </TableRow>
            )}
            {byMonthRows.map((row) => (
              <TableRow key={row.month}>
                <TableCell className="font-medium">{row.month}</TableCell>
                <TableCell className="text-right tabular-nums">{row.inputQty}</TableCell>
                <TableCell className="text-right tabular-nums">{row.wastageQty}</TableCell>
                <TableCell className="text-right tabular-nums">{row.wastagePercent}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
