import Link from "next/link";
import { getTenantDb, getTenantContext } from "@/lib/tenant-db";
import { prisma } from "@/lib/prisma";
import { isLowStock } from "@/lib/billing/low-stock";
import { requireActiveSubscription } from "@/lib/billing/subscription";
import { ciContains } from "@/lib/db-search";
import { ListFilterBar } from "@/components/list/list-filter-bar";
import { BackButton } from "@/components/dashboard/back-button";
import { AddCategoryButton } from "@/components/products/add-category-button";
import { PriceManagementDialog } from "@/components/products/price-management-dialog";
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

const OTHER_GROUP_ID = "OTHER";

const STOCK_CATEGORY_OPTIONS = [
  { value: "RAW", label: "Raw material" },
  { value: "WIP", label: "Work in progress" },
  { value: "FINISHED", label: "Finished" },
  { value: "BYPRODUCT", label: "Byproduct" },
  { value: "TRADE", label: "Trade" },
];

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  await requireActiveSubscription();
  const params = await searchParams;
  const q = params.q?.trim() ?? "";

  const { tenantId } = await getTenantContext();
  const db = await getTenantDb();

  const where = {
    ...(q
      ? {
          OR: [
            { name: ciContains(q) },
            { hsnCode: ciContains(q) },
          ],
        }
      : {}),
    ...(params.category ? { stockCategory: params.category } : {}),
  };

  const [products, tenant, categories] = await Promise.all([
    db.product.findMany({ where, orderBy: { name: "asc" } }),
    prisma.tenant.findUniqueOrThrow({ where: { id: tenantId }, select: { businessType: true } }),
    db.productCategory.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  const isAgro = tenant.businessType === "AGRO";

  const productsByCategory = new Map<string, typeof products>();
  for (const product of products) {
    const key = product.categoryId ?? OTHER_GROUP_ID;
    const list = productsByCategory.get(key) ?? [];
    list.push(product);
    productsByCategory.set(key, list);
  }

  // One segmented box per category (shown even when empty, so a newly
  // created category is visible right away), plus "Other" last for
  // uncategorized products — hidden while searching if it has no matches.
  const groups = [
    ...categories.map((c) => ({ id: c.id, name: c.name, products: productsByCategory.get(c.id) ?? [] })),
    { id: OTHER_GROUP_ID, name: "Other", products: productsByCategory.get(OTHER_GROUP_ID) ?? [] },
  ].filter((group) => !q || group.products.length > 0);

  return (
    <div className="flex flex-col gap-6">
      <BackButton />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Products</h1>
        <Button render={<Link href="/dashboard/products/new" />} nativeButton={false}>
          Add product
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <ListFilterBar
          searchPlaceholder="Search by name or HSN..."
          q={q}
          status={params.category}
          statusOptions={STOCK_CATEGORY_OPTIONS}
          statusParamName="category"
          statusLabel="Stock category"
        />
        <AddCategoryButton />
      </div>

      {groups.length === 0 && (
        <div className="bg-card text-muted-foreground rounded-xl border p-8 text-center text-sm shadow-sm">
          No products match &ldquo;{q}&rdquo;.
        </div>
      )}

      {groups.map((group) => (
        <div key={group.id} className="bg-card overflow-hidden rounded-xl border shadow-sm">
          <div className="flex items-center gap-2 border-b px-5 py-3.5">
            <h2 className="text-sm font-bold">{group.name}</h2>
            <Badge variant="secondary">{group.products.length}</Badge>
          </div>
          {group.products.length === 0 ? (
            <p className="text-muted-foreground p-5 text-sm">No products in this category yet.</p>
          ) : (
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
                {group.products.map((product) => {
                  const lowStock = isLowStock(product.stockQty, product.lowStockAlert);
                  return (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.hsnCode ?? "—"}</TableCell>
                      <TableCell>{product.unit}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {Number(product.gstRate)}%
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        ₹{Number(product.sellingPrice).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        <span className={lowStock ? "text-destructive font-medium" : ""}>
                          {Number(product.stockQty)} {product.unit}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.isActive ? "success" : "secondary"}>
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
                        <PriceManagementDialog
                          product={{
                            id: product.id,
                            name: product.name,
                            purchasePrice: product.purchasePrice.toString(),
                            sellingPrice: product.sellingPrice.toString(),
                          }}
                        />
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
          )}
        </div>
      ))}
    </div>
  );
}
