import { getTenantDb } from "@/lib/tenant-db";
import { requireActiveSubscription } from "@/lib/billing/subscription";
import { resolveDateRange } from "@/lib/reports/date-range";
import { DateRangeForm } from "@/components/reports/date-range-form";
import { ExportCsvButton } from "@/components/reports/export-csv-button";
import { PrintReportButton } from "@/components/reports/print-report-button";
import { BackButton } from "@/components/dashboard/back-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function YieldReportPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  await requireActiveSubscription();
  const { from, to, fromStr, toStr } = resolveDateRange(await searchParams, 90);

  const db = await getTenantDb();
  const runs = await db.productionRun.findMany({
    where: { status: "COMPLETED", completedAt: { gte: from, lte: to } },
    include: {
      bom: { select: { name: true } },
      inputs: true,
      outputs: true,
    },
    orderBy: { completedAt: "desc" },
  });

  const rows = runs.map((run) => {
    const inputQty = run.inputs.reduce((sum, i) => sum + Number(i.qty), 0);
    const outputQty = run.outputs
      .filter((o) => o.outputType !== "WASTAGE")
      .reduce((sum, o) => sum + Number(o.qty), 0);
    const wastageQty = run.outputs.filter((o) => o.outputType === "WASTAGE").reduce((sum, o) => sum + Number(o.qty), 0);
    return {
      runNumber: run.runNumber,
      bom: run.bom?.name ?? "Ad-hoc",
      date: run.completedAt ? run.completedAt.toLocaleDateString("en-IN") : "—",
      inputQty,
      outputQty,
      wastageQty,
      yieldPercent: run.yieldPercent != null ? Number(run.yieldPercent).toFixed(1) : "—",
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <BackButton />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Yield history</h1>
          <p className="text-muted-foreground text-sm">Input vs. output and yield % for completed runs.</p>
        </div>
        <div className="flex items-center gap-2">
          <PrintReportButton />
          <ExportCsvButton
            rows={rows}
            filename="production-yield.csv"
            columns={[
              { key: "runNumber", label: "Run #" },
              { key: "bom", label: "BOM" },
              { key: "date", label: "Date" },
              { key: "inputQty", label: "Input qty" },
              { key: "outputQty", label: "Output qty" },
              { key: "wastageQty", label: "Wastage qty" },
              { key: "yieldPercent", label: "Yield %" },
            ]}
          />
        </div>
      </div>

      <DateRangeForm from={fromStr} to={toStr} />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Run #</TableHead>
            <TableHead>BOM</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Input qty</TableHead>
            <TableHead className="text-right">Output qty</TableHead>
            <TableHead className="text-right">Wastage qty</TableHead>
            <TableHead className="text-right">Yield %</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-muted-foreground text-center">
                No completed runs in this period.
              </TableCell>
            </TableRow>
          )}
          {rows.map((row) => (
            <TableRow key={row.runNumber}>
              <TableCell className="font-medium">{row.runNumber}</TableCell>
              <TableCell>{row.bom}</TableCell>
              <TableCell>{row.date}</TableCell>
              <TableCell className="text-right tabular-nums">{row.inputQty}</TableCell>
              <TableCell className="text-right tabular-nums">{row.outputQty}</TableCell>
              <TableCell className="text-right tabular-nums">{row.wastageQty}</TableCell>
              <TableCell className="text-right tabular-nums">{row.yieldPercent}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
