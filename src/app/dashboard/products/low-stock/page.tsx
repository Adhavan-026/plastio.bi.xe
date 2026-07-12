import Link from "next/link";
import { getTenantDb } from "@/lib/tenant-db";
import { isLowStock } from "@/lib/billing/low-stock";
import { BackButton } from "@/components/dashboard/back-button";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function LowStockPage() {
  const db = await getTenantDb();
  const products = await db.product.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  const lowStockProducts = products.filter((p) => isLowStock(p.stockQty, p.lowStockAlert));

  return (
    <div className="flex flex-col gap-6">
      <BackButton />
      <div>
        <h1 className="text-2xl font-semibold">Low stock</h1>
        <p className="text-muted-foreground text-sm">
          Products at or below their alert threshold.
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead className="text-right">Stock</TableHead>
            <TableHead className="text-right">Alert at</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {lowStockProducts.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-muted-foreground text-center">
                Nothing is low on stock.
              </TableCell>
            </TableRow>
          )}
          {lowStockProducts.map((product) => (
            <TableRow key={product.id}>
              <TableCell className="font-medium">{product.name}</TableCell>
              <TableCell className="text-destructive text-right font-medium">
                {Number(product.stockQty)} {product.unit}
              </TableCell>
              <TableCell className="text-right">
                {Number(product.lowStockAlert)} {product.unit}
              </TableCell>
              <TableCell>
                <Button
                  render={<Link href={`/dashboard/products/${product.id}/adjust-stock`} />}
                  nativeButton={false}
                  variant="ghost"
                  size="sm"
                >
                  Adjust stock
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
