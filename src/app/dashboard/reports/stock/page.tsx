import { getTenantDb } from "@/lib/tenant-db";
import { ExportCsvButton } from "@/components/reports/export-csv-button";
import { StockValueChart } from "@/components/reports/stock-value-chart";
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

export default async function StockReportPage() {
  await requireActiveSubscription();
  const db = await getTenantDb();
  const products = await db.product.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  const rows = products.map((p) => {
    const qty = Number(p.stockQty);
    const costValue = qty * Number(p.purchasePrice);
    const sellingValue = qty * Number(p.sellingPrice);
    return {
      name: p.name,
      unit: p.unit,
      quantity: qty,
      purchasePrice: Number(p.purchasePrice),
      sellingPrice: Number(p.sellingPrice),
      costValue,
      sellingValue,
    };
  });

  const grand = rows.reduce(
    (acc, r) => ({ costValue: acc.costValue + r.costValue, sellingValue: acc.sellingValue + r.sellingValue }),
    { costValue: 0, sellingValue: 0 }
  );

  return (
    <div className="flex flex-col gap-6">
      <BackButton />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Stock valuation</h1>
          <p className="text-muted-foreground text-sm">Current stock as of now.</p>
        </div>
        <ExportCsvButton
          rows={rows}
          filename="stock-valuation.csv"
          columns={[
            { key: "name", label: "Product" },
            { key: "unit", label: "Unit" },
            { key: "quantity", label: "Quantity" },
            { key: "purchasePrice", label: "Purchase price" },
            { key: "sellingPrice", label: "Selling price" },
            { key: "costValue", label: "Value at cost" },
            { key: "sellingValue", label: "Value at selling price" },
          ]}
        />
      </div>

      <StockValueChart rows={rows} />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead className="text-right">Purchase price</TableHead>
            <TableHead className="text-right">Selling price</TableHead>
            <TableHead className="text-right">Value at cost</TableHead>
            <TableHead className="text-right">Value at selling price</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-muted-foreground text-center">
                No products.
              </TableCell>
            </TableRow>
          )}
          {rows.map((row) => (
            <TableRow key={row.name}>
              <TableCell className="font-medium">{row.name}</TableCell>
              <TableCell className="text-right">
                {row.quantity} {row.unit}
              </TableCell>
              <TableCell className="text-right">₹{row.purchasePrice.toFixed(2)}</TableCell>
              <TableCell className="text-right">₹{row.sellingPrice.toFixed(2)}</TableCell>
              <TableCell className="text-right">₹{row.costValue.toFixed(2)}</TableCell>
              <TableCell className="text-right">₹{row.sellingValue.toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        {rows.length > 0 && (
          <TableFooter>
            <TableRow>
              <TableCell className="font-medium">Total</TableCell>
              <TableCell />
              <TableCell />
              <TableCell />
              <TableCell className="text-right font-medium">₹{grand.costValue.toFixed(2)}</TableCell>
              <TableCell className="text-right font-medium">₹{grand.sellingValue.toFixed(2)}</TableCell>
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </div>
  );
}
