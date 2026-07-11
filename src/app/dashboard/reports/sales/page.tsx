import { getTenantDb } from "@/lib/tenant-db";
import { resolveDateRange } from "@/lib/reports/date-range";
import { DateRangeForm } from "@/components/reports/date-range-form";
import { ExportCsvButton } from "@/components/reports/export-csv-button";
import { SalesTrendChart } from "@/components/reports/sales-trend-chart";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type DailyRow = {
  date: string;
  invoiceCount: number;
  subtotal: number;
  tax: number;
  total: number;
};

export default async function SalesReportPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const { from, to, fromStr, toStr } = resolveDateRange(params);

  const db = await getTenantDb();
  const invoices = await db.invoice.findMany({
    where: { type: "SALES", invoiceDate: { gte: from, lte: to } },
    select: {
      invoiceDate: true,
      taxableAmount: true,
      cgstAmount: true,
      sgstAmount: true,
      igstAmount: true,
      totalAmount: true,
    },
    orderBy: { invoiceDate: "asc" },
  });

  const rowsByDay = new Map<string, DailyRow>();
  for (const inv of invoices) {
    const key = inv.invoiceDate.toISOString().slice(0, 10);
    const existing = rowsByDay.get(key) ?? { date: key, invoiceCount: 0, subtotal: 0, tax: 0, total: 0 };
    existing.invoiceCount += 1;
    existing.subtotal += Number(inv.taxableAmount);
    existing.tax += Number(inv.cgstAmount) + Number(inv.sgstAmount) + Number(inv.igstAmount);
    existing.total += Number(inv.totalAmount);
    rowsByDay.set(key, existing);
  }
  const rows = Array.from(rowsByDay.values()).sort((a, b) => a.date.localeCompare(b.date));

  const grandTotal = rows.reduce(
    (acc, r) => ({
      invoiceCount: acc.invoiceCount + r.invoiceCount,
      subtotal: acc.subtotal + r.subtotal,
      tax: acc.tax + r.tax,
      total: acc.total + r.total,
    }),
    { invoiceCount: 0, subtotal: 0, tax: 0, total: 0 }
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Sales report</h1>
        <ExportCsvButton
          rows={rows}
          filename={`sales-report-${fromStr}-to-${toStr}.csv`}
          columns={[
            { key: "date", label: "Date" },
            { key: "invoiceCount", label: "Invoices" },
            { key: "subtotal", label: "Taxable amount" },
            { key: "tax", label: "Tax" },
            { key: "total", label: "Total" },
          ]}
        />
      </div>

      <DateRangeForm from={fromStr} to={toStr} />

      <SalesTrendChart rows={rows} />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Invoices</TableHead>
            <TableHead className="text-right">Taxable amount</TableHead>
            <TableHead className="text-right">Tax</TableHead>
            <TableHead className="text-right">Total</TableHead>
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
            <TableRow key={row.date}>
              <TableCell>{new Date(row.date).toLocaleDateString("en-IN")}</TableCell>
              <TableCell className="text-right">{row.invoiceCount}</TableCell>
              <TableCell className="text-right">₹{row.subtotal.toFixed(2)}</TableCell>
              <TableCell className="text-right">₹{row.tax.toFixed(2)}</TableCell>
              <TableCell className="text-right">₹{row.total.toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        {rows.length > 0 && (
          <TableFooter>
            <TableRow>
              <TableCell className="font-medium">Total</TableCell>
              <TableCell className="text-right font-medium">{grandTotal.invoiceCount}</TableCell>
              <TableCell className="text-right font-medium">₹{grandTotal.subtotal.toFixed(2)}</TableCell>
              <TableCell className="text-right font-medium">₹{grandTotal.tax.toFixed(2)}</TableCell>
              <TableCell className="text-right font-medium">₹{grandTotal.total.toFixed(2)}</TableCell>
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </div>
  );
}
