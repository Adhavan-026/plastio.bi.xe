import { getTenantDb } from "@/lib/tenant-db";
import { resolveDateRange } from "@/lib/reports/date-range";
import { DateRangeForm } from "@/components/reports/date-range-form";
import { ExportCsvButton } from "@/components/reports/export-csv-button";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function ItemsReportPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const { from, to, fromStr, toStr } = resolveDateRange(params);

  const db = await getTenantDb();
  const grouped = await db.invoiceItem.groupBy({
    by: ["description"],
    where: { invoice: { type: "SALES", invoiceDate: { gte: from, lte: to } } },
    _sum: { quantity: true, taxableAmount: true, totalAmount: true },
    _count: true,
    orderBy: { _sum: { totalAmount: "desc" } },
  });

  const rows = grouped.map((g) => ({
    description: g.description,
    invoiceLines: g._count,
    quantity: Number(g._sum.quantity ?? 0),
    taxable: Number(g._sum.taxableAmount ?? 0),
    revenue: Number(g._sum.totalAmount ?? 0),
  }));

  const grand = rows.reduce(
    (acc, r) => ({
      quantity: acc.quantity + r.quantity,
      taxable: acc.taxable + r.taxable,
      revenue: acc.revenue + r.revenue,
    }),
    { quantity: 0, taxable: 0, revenue: 0 }
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Item-wise sales</h1>
        <ExportCsvButton
          rows={rows}
          filename={`item-sales-${fromStr}-to-${toStr}.csv`}
          columns={[
            { key: "description", label: "Item" },
            { key: "invoiceLines", label: "Times sold" },
            { key: "quantity", label: "Quantity" },
            { key: "taxable", label: "Taxable amount" },
            { key: "revenue", label: "Revenue" },
          ]}
        />
      </div>

      <DateRangeForm from={fromStr} to={toStr} />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item</TableHead>
            <TableHead className="text-right">Times sold</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead className="text-right">Taxable amount</TableHead>
            <TableHead className="text-right">Revenue</TableHead>
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
            <TableRow key={row.description}>
              <TableCell className="font-medium">{row.description}</TableCell>
              <TableCell className="text-right">{row.invoiceLines}</TableCell>
              <TableCell className="text-right">{row.quantity}</TableCell>
              <TableCell className="text-right">₹{row.taxable.toFixed(2)}</TableCell>
              <TableCell className="text-right">₹{row.revenue.toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        {rows.length > 0 && (
          <TableFooter>
            <TableRow>
              <TableCell className="font-medium">Total</TableCell>
              <TableCell />
              <TableCell className="text-right font-medium">{grand.quantity}</TableCell>
              <TableCell className="text-right font-medium">₹{grand.taxable.toFixed(2)}</TableCell>
              <TableCell className="text-right font-medium">₹{grand.revenue.toFixed(2)}</TableCell>
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </div>
  );
}
