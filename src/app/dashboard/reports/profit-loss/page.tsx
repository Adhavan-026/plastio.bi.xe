import { getTenantDb } from "@/lib/tenant-db";
import { resolveDateRange } from "@/lib/reports/date-range";
import { DateRangeForm } from "@/components/reports/date-range-form";
import { ExportCsvButton } from "@/components/reports/export-csv-button";
import { ProfitLossChart } from "@/components/reports/profit-loss-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type DailyRow = { date: string; revenue: number; cogs: number; profit: number };

export default async function ProfitLossReportPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const { from, to, fromStr, toStr } = resolveDateRange(params);

  const db = await getTenantDb();
  const items = await db.invoiceItem.findMany({
    where: { invoice: { type: "SALES", invoiceDate: { gte: from, lte: to } } },
    select: {
      quantity: true,
      taxableAmount: true,
      product: { select: { purchasePrice: true } },
      invoice: { select: { invoiceDate: true } },
    },
  });

  const rowsByDay = new Map<string, DailyRow>();
  for (const item of items) {
    const key = item.invoice.invoiceDate.toISOString().slice(0, 10);
    const existing = rowsByDay.get(key) ?? { date: key, revenue: 0, cogs: 0, profit: 0 };
    const revenue = Number(item.taxableAmount);
    const cogs = item.product ? Number(item.quantity) * Number(item.product.purchasePrice) : 0;
    existing.revenue += revenue;
    existing.cogs += cogs;
    existing.profit += revenue - cogs;
    rowsByDay.set(key, existing);
  }
  const rows = Array.from(rowsByDay.values()).sort((a, b) => a.date.localeCompare(b.date));

  const grand = rows.reduce(
    (acc, r) => ({ revenue: acc.revenue + r.revenue, cogs: acc.cogs + r.cogs, profit: acc.profit + r.profit }),
    { revenue: 0, cogs: 0, profit: 0 }
  );
  const margin = grand.revenue > 0 ? (grand.profit / grand.revenue) * 100 : 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Profit &amp; loss</h1>
        <p className="text-muted-foreground text-sm">
          Gross profit only — cost of goods sold uses each product&apos;s current purchase price
          (not the price at time of sale), and no overhead/expense tracking exists yet.
        </p>
      </div>

      <DateRangeForm from={fromStr} to={toStr} />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Revenue</CardDescription>
            <CardTitle className="text-2xl">₹{grand.revenue.toFixed(2)}</CardTitle>
          </CardHeader>
          <CardContent />
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Cost of goods sold</CardDescription>
            <CardTitle className="text-2xl">₹{grand.cogs.toFixed(2)}</CardTitle>
          </CardHeader>
          <CardContent />
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Gross profit</CardDescription>
            <CardTitle className="text-2xl">₹{grand.profit.toFixed(2)}</CardTitle>
          </CardHeader>
          <CardContent />
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Gross margin</CardDescription>
            <CardTitle className="text-2xl">{margin.toFixed(1)}%</CardTitle>
          </CardHeader>
          <CardContent />
        </Card>
      </div>

      <ProfitLossChart rows={rows} />

      <div className="flex items-center justify-end">
        <ExportCsvButton
          rows={rows}
          filename={`profit-loss-${fromStr}-to-${toStr}.csv`}
          columns={[
            { key: "date", label: "Date" },
            { key: "revenue", label: "Revenue" },
            { key: "cogs", label: "COGS" },
            { key: "profit", label: "Gross profit" },
          ]}
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Revenue</TableHead>
            <TableHead className="text-right">COGS</TableHead>
            <TableHead className="text-right">Gross profit</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-muted-foreground text-center">
                No sales in this range.
              </TableCell>
            </TableRow>
          )}
          {rows.map((row) => (
            <TableRow key={row.date}>
              <TableCell>{new Date(row.date).toLocaleDateString("en-IN")}</TableCell>
              <TableCell className="text-right">₹{row.revenue.toFixed(2)}</TableCell>
              <TableCell className="text-right">₹{row.cogs.toFixed(2)}</TableCell>
              <TableCell className="text-right">₹{row.profit.toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        {rows.length > 0 && (
          <TableFooter>
            <TableRow>
              <TableCell className="font-medium">Total</TableCell>
              <TableCell className="text-right font-medium">₹{grand.revenue.toFixed(2)}</TableCell>
              <TableCell className="text-right font-medium">₹{grand.cogs.toFixed(2)}</TableCell>
              <TableCell className="text-right font-medium">₹{grand.profit.toFixed(2)}</TableCell>
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </div>
  );
}
