import Link from "next/link";
import { getTenantDb, getTenantContext } from "@/lib/tenant-db";
import { prisma } from "@/lib/prisma";
import { isLowStock } from "@/lib/billing/low-stock";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function ProductsPage() {
  const { tenantId } = await getTenantContext();
  const db = await getTenantDb();
  const [products, tenant] = await Promise.all([
    db.product.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.tenant.findUniqueOrThrow({ where: { id: tenantId }, select: { businessType: true } }),
  ]);
  const isAgro = tenant.businessType === "AGRO";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Products</h1>
        <Button render={<Link href="/dashboard/products/new" />} nativeButton={false}>
          Add product
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>HSN</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead className="text-right">GST %</TableHead>
            <TableHead className="text-right">Selling price</TableHead>
            <TableHead className="text-right">Stock</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-muted-foreground text-center">
                No products yet.
              </TableCell>
            </TableRow>
          )}
          {products.map((product) => {
            const lowStock = isLowStock(product.stockQty, product.lowStockAlert);
            return (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>{product.hsnCode ?? "—"}</TableCell>
                <TableCell>{product.unit}</TableCell>
                <TableCell className="text-right">{Number(product.gstRate)}%</TableCell>
                <TableCell className="text-right">₹{Number(product.sellingPrice).toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  <span className={lowStock ? "text-destructive font-medium" : ""}>
                    {Number(product.stockQty)} {product.unit}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={product.isActive ? "default" : "secondary"}>
                    {product.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="flex gap-1">
                  <Button
                    render={<Link href={`/dashboard/products/${product.id}/edit`} />}
                    nativeButton={false}
                    variant="ghost"
                    size="sm"
                  >
                    Edit
                  </Button>
                  <Button
                    render={<Link href={`/dashboard/products/${product.id}/adjust-stock`} />}
                    nativeButton={false}
                    variant="ghost"
                    size="sm"
                  >
                    Adjust stock
                  </Button>
                  {isAgro && (
                    <Button
                      render={<Link href={`/dashboard/products/${product.id}/batches`} />}
                      nativeButton={false}
                      variant="ghost"
                      size="sm"
                    >
                      Batches
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
