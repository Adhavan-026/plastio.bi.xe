import { notFound } from "next/navigation";
import { getTenantDb } from "@/lib/tenant-db";
import { getExpiryStatus } from "@/lib/billing/expiry";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireActiveSubscription } from "@/lib/billing/subscription";
import { BackButton } from "@/components/dashboard/back-button";
import { BatchForm } from "./batch-form";

const STATUS_LABEL: Record<string, string> = {
  expired: "Expired",
  expiring_soon: "Expiring soon",
  ok: "OK",
  none: "—",
};

const STATUS_BADGE_VARIANT: Record<string, "destructive" | "warning" | "success" | "secondary"> = {
  expired: "destructive",
  expiring_soon: "warning",
  ok: "success",
  none: "secondary",
};

export default async function ProductBatchesPage({ params }: { params: Promise<{ id: string }> }) {
  await requireActiveSubscription();
  const { id } = await params;
  const db = await getTenantDb();

  const product = await db.product.findUnique({ where: { id } });
  if (!product) notFound();

  const batches = await db.stockBatch.findMany({
    where: { productId: id },
    orderBy: [{ expiryDate: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="flex flex-col gap-8">
      <BackButton />
      <div>
        <h1 className="text-2xl font-semibold">Batches — {product.name}</h1>
        <p className="text-muted-foreground text-sm">
          Total stock: {Number(product.stockQty)} {product.unit}
        </p>
      </div>

      <BatchForm productId={product.id} />

      <div>
        <h2 className="mb-2 text-lg font-medium">Batches (oldest expiry first)</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Batch #</TableHead>
              <TableHead>Mfg date</TableHead>
              <TableHead>Expiry date</TableHead>
              <TableHead className="text-right">Remaining</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {batches.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground text-center">
                  No batches yet.
                </TableCell>
              </TableRow>
            )}
            {batches.map((batch) => {
              const status = getExpiryStatus(batch.expiryDate);
              return (
                <TableRow key={batch.id}>
                  <TableCell className="font-medium">{batch.batchNumber}</TableCell>
                  <TableCell>{batch.mfgDate?.toLocaleDateString("en-IN") ?? "—"}</TableCell>
                  <TableCell>{batch.expiryDate?.toLocaleDateString("en-IN") ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    {Number(batch.quantity)} {product.unit}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_BADGE_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
