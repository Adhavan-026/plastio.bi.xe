import Link from "next/link";
import { getTenantDb } from "@/lib/tenant-db";
import { getExpiryStatus } from "@/lib/billing/expiry";
import { requireActiveSubscription } from "@/lib/billing/subscription";
import { BackButton } from "@/components/dashboard/back-button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STATUS_LABEL: Record<string, string> = {
  expired: "Expired",
  expiring_soon: "Expiring soon",
};

export default async function ExpiryAlertsPage() {
  await requireActiveSubscription();
  const db = await getTenantDb();

  const batches = await db.stockBatch.findMany({
    where: { quantity: { gt: 0 } },
    include: { product: { select: { id: true, name: true, unit: true } } },
    orderBy: { expiryDate: "asc" },
  });

  const flagged = batches.filter((b) => {
    const status = getExpiryStatus(b.expiryDate);
    return status === "expired" || status === "expiring_soon";
  });

  return (
    <div className="flex flex-col gap-6">
      <BackButton />
      <div>
        <h1 className="text-2xl font-semibold">Expiry alerts</h1>
        <p className="text-muted-foreground text-sm">
          Batches already expired or expiring within 30 days.
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Batch #</TableHead>
            <TableHead>Expiry date</TableHead>
            <TableHead className="text-right">Remaining</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {flagged.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-muted-foreground text-center">
                Nothing expired or expiring soon.
              </TableCell>
            </TableRow>
          )}
          {flagged.map((batch) => {
            const status = getExpiryStatus(batch.expiryDate);
            return (
              <TableRow key={batch.id}>
                <TableCell className="font-medium">
                  <Link
                    href={`/dashboard/products/${batch.product.id}/batches`}
                    className="underline underline-offset-4"
                  >
                    {batch.product.name}
                  </Link>
                </TableCell>
                <TableCell>{batch.batchNumber}</TableCell>
                <TableCell>{batch.expiryDate?.toLocaleDateString("en-IN") ?? "—"}</TableCell>
                <TableCell className="text-right">
                  {Number(batch.quantity)} {batch.product.unit}
                </TableCell>
                <TableCell>
                  <Badge variant={status === "expired" ? "destructive" : "warning"}>
                    {STATUS_LABEL[status]}
                  </Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
