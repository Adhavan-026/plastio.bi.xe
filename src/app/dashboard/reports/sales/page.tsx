import { getTenantDb } from "@/lib/tenant-db";
import { resolveDateRange } from "@/lib/reports/date-range";
import { DateRangeForm } from "@/components/reports/date-range-form";
import { ExportCsvButton } from "@/components/reports/export-csv-button";
import { PrintReportButton } from "@/components/reports/print-report-button";
import { SalesTrendChart } from "@/components/reports/sales-trend-chart";
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

type SaleRow = {
  date: string;
  customer: string;
  product: string;
  quantity: number;
  buyingPrice: number;
  sellingPrice: number;
  marginPercent: number;
};

export default async function SalesReportPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  await requireActiveSubscription();
  const params = await searchParams;
  const { from, to, fromStr, toStr } = resolveDateRange(params);

  const db = await getTenantDb();
  const items = await db.invoiceItem.findMany({
    where: { invoice: { type: "SALES", invoiceDate: { gte: from, lte: to } } },
    select: {
      description: true,
      quantity: true,
      rate: true,
      product: { select: { purchasePrice: true } },
      invoice: {
        select: {
          invoiceDate: true,
          invoiceNumber: true,
          party: { select: { name: true } },
        },
      },
    },
    orderBy: [{ invoice: { invoiceDate: "asc" } }, { invoice: { invoiceNumber: "asc" } }],
  });

  const rows: SaleRow[] = items.map((item) => {
    const sellingPrice = Number(item.rate);
    const buyingPrice = item.product ? Number(item.product.purchasePrice) : 0;
    const marginPercent = sellingPrice > 0 ? ((sellingPrice - buyingPrice) / sellingPrice) * 100 : 0;
    return {
      date: item.invoice.invoiceDate.toISOString().slice(0, 10),
      customer: item.invoice.party?.name ?? "Walk-in",
      product: item.description,
      quantity: Number(item.quantity),
      buyingPrice,
      sellingPrice,
      marginPercent,
    };
  });

  const totalBuying = rows.reduce((sum, r) => sum + r.buyingPrice * r.quantity, 0);
  const totalSelling = rows.reduce((sum, r) => sum + r.sellingPrice * r.quantity, 0);
  const overallMargin = totalSelling > 0 ? ((totalSelling - totalBuying) / totalSelling) * 100 : 0;

  const dailyByDate = new Map<string, { revenue: number; profit: number }>();
  for (const row of rows) {
    const entry = dailyByDate.get(row.date) ?? { revenue: 0, profit: 0 };
    entry.revenue += row.sellingPrice * row.quantity;
    entry.profit += (row.sellingPrice - row.buyingPrice) * row.quantity;
    dailyByDate.set(row.date, entry);
  }
  const dailyRows = Array.from(dailyByDate.entries())
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="flex flex-col gap-6">
      <BackButton />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Sales report</h1>
        <div className="flex items-center gap-2">
          <PrintReportButton />
          <ExportCsvButton
            rows={rows}
            filename={`sales-report-${fromStr}-to-${toStr}.csv`}
            columns={[
              { key: "date", label: "Date" },
              { key: "customer", label: "Customer" },
              { key: "product", label: "Product" },
              { key: "quantity", label: "Quantity" },
              { key: "buyingPrice", label: "Buying price" },
              { key: "sellingPrice", label: "Selling price" },
              { key: "marginPercent", label: "Profit margin %" },
            ]}
          />
        </div>
      </div>

      <DateRangeForm from={fromStr} to={toStr} />

      <SalesTrendChart rows={dailyRows} />

      <p className="text-muted-foreground text-xs">
        Buying price is each product&apos;s current purchase price (not the price at time of
        sale). Margin % = (Selling &minus; Buying) &divide; Selling &times; 100, per unit —
        quantity doesn&apos;t affect it.
      </p>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Product</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead className="text-right">Buying price</TableHead>
            <TableHead className="text-right">Selling price</TableHead>
            <TableHead className="text-right">Margin %</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-muted-foreground text-center">
                No sales in this range.
              </TableCell>
            </TableRow>
          )}
          {rows.map((row, i) => (
            <TableRow key={i}>
              <TableCell>{new Date(row.date).toLocaleDateString("en-IN")}</TableCell>
              <TableCell>{row.customer}</TableCell>
              <TableCell className="font-medium">{row.product}</TableCell>
              <TableCell className="text-right tabular-nums">{row.quantity}</TableCell>
              <TableCell className="text-right tabular-nums">₹{row.buyingPrice.toFixed(2)}</TableCell>
              <TableCell className="text-right tabular-nums">₹{row.sellingPrice.toFixed(2)}</TableCell>
              <TableCell
                className={`text-right tabular-nums font-medium ${row.marginPercent < 0 ? "text-destructive" : ""}`}
              >
                {row.marginPercent.toFixed(1)}%
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        {rows.length > 0 && (
          <TableFooter>
            <TableRow>
              <TableCell colSpan={4} className="font-medium">
                Total
              </TableCell>
              <TableCell className="text-right font-medium">₹{totalBuying.toFixed(2)}</TableCell>
              <TableCell className="text-right font-medium">₹{totalSelling.toFixed(2)}</TableCell>
              <TableCell className="text-right font-medium">{overallMargin.toFixed(1)}%</TableCell>
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </div>
  );
}
