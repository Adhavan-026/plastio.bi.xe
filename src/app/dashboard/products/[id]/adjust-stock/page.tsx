import { notFound } from "next/navigation";
import { getTenantDb } from "@/lib/tenant-db";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BackButton } from "@/components/dashboard/back-button";
import { AdjustStockForm } from "./adjust-stock-form";

export default async function AdjustStockPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await getTenantDb();

  const product = await db.product.findUnique({ where: { id } });
  if (!product) notFound();

  const adjustments = await db.stockAdjustment.findMany({
    where: { productId: id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div className="flex flex-col gap-8">
      <BackButton />
      <div>
        <h1 className="text-2xl font-semibold">Adjust stock — {product.name}</h1>
        <p className="text-muted-foreground text-sm">
          Current stock: {Number(product.stockQty)} {product.unit}
        </p>
      </div>

      <AdjustStockForm productId={product.id} />

      <div>
        <h2 className="mb-2 text-lg font-medium">Recent adjustments</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Change</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {adjustments.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground text-center">
                  No adjustments yet.
                </TableCell>
              </TableRow>
            )}
            {adjustments.map((adj) => {
              const change = Number(adj.quantityChange);
              return (
                <TableRow key={adj.id}>
                  <TableCell>{adj.createdAt.toLocaleString("en-IN")}</TableCell>
                  <TableCell className={`text-right ${change < 0 ? "text-destructive" : "text-success"}`}>
                    {change > 0 ? "+" : ""}
                    {change}
                  </TableCell>
                  <TableCell>{adj.reason.replace("_", " ")}</TableCell>
                  <TableCell>{adj.notes ?? "—"}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
