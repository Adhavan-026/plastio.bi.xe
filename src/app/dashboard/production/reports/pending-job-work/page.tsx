import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { getTenantDb } from "@/lib/tenant-db";
import { requireActiveSubscription } from "@/lib/billing/subscription";
import { ExportCsvButton } from "@/components/reports/export-csv-button";
import { PrintReportButton } from "@/components/reports/print-report-button";
import { BackButton } from "@/components/dashboard/back-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function daysBetween(a: Date, b: Date): number {
  return Math.floor((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

export default async function PendingJobWorkReportPage() {
  await requireActiveSubscription();
  const db = await getTenantDb();
  const today = new Date();

  const challans = await db.jobWorkChallan.findMany({
    where: { direction: "OUTWARD", status: { not: "CLOSED" } },
    include: { party: { select: { name: true } }, lines: { include: { product: { select: { name: true, unit: true } } } } },
    orderBy: { date: "asc" },
  });

  const rows = challans.map((c) => ({
    id: c.id,
    challanNumber: c.challanNumber,
    party: c.party.name,
    date: c.date.toLocaleDateString("en-IN"),
    items: c.lines.map((l) => `${l.product.name} (${Number(l.qty)} ${l.product.unit})`).join(", "),
    daysOutstanding: daysBetween(today, c.date),
    expectedReturnDate: c.expectedReturnDate,
    overdue: !!c.expectedReturnDate && c.expectedReturnDate < today,
    status: c.status,
  }));

  return (
    <div className="flex flex-col gap-6">
      <BackButton />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Pending job work</h1>
          <p className="text-muted-foreground text-sm">Goods still out with job workers.</p>
        </div>
        <div className="flex items-center gap-2">
          <PrintReportButton />
          <ExportCsvButton
            rows={rows}
            filename="pending-job-work.csv"
            columns={[
              { key: "challanNumber", label: "Challan #" },
              { key: "party", label: "Job worker" },
              { key: "date", label: "Sent on" },
              { key: "items", label: "Items" },
              { key: "daysOutstanding", label: "Days outstanding" },
              { key: "status", label: "Status" },
            ]}
          />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Challan #</TableHead>
            <TableHead>Job worker</TableHead>
            <TableHead>Sent on</TableHead>
            <TableHead>Items</TableHead>
            <TableHead className="text-right">Days outstanding</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-muted-foreground text-center">
                Nothing pending with job workers.
              </TableCell>
            </TableRow>
          )}
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">
                <Link href={`/dashboard/production/job-work/${row.id}`} className="underline underline-offset-4">
                  {row.challanNumber}
                </Link>
              </TableCell>
              <TableCell>{row.party}</TableCell>
              <TableCell>{row.date}</TableCell>
              <TableCell className="max-w-xs truncate">{row.items}</TableCell>
              <TableCell className="text-right tabular-nums">
                <span className={row.overdue ? "text-destructive flex items-center justify-end gap-1 font-medium" : ""}>
                  {row.overdue && <TriangleAlert className="size-3.5" />}
                  {row.daysOutstanding}
                </span>
              </TableCell>
              <TableCell>{row.status.replace("_", " ")}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
