import { getTenantDb } from "@/lib/tenant-db";
import { requireActiveSubscription } from "@/lib/billing/subscription";
import { BackButton } from "@/components/dashboard/back-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RunForm } from "../run-form";

export default async function NewProductionRunPage() {
  await requireActiveSubscription();
  const db = await getTenantDb();

  const [products, boms] = await Promise.all([
    db.product.findMany({
      where: { isActive: true },
      select: { id: true, name: true, unit: true },
      orderBy: { name: "asc" },
    }),
    db.bom.findMany({
      where: { isActive: true },
      include: { lines: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <BackButton />
      <h1 className="text-2xl font-semibold">New production run</h1>
      <Card>
        <CardHeader>
          <CardTitle>Draft run</CardTitle>
        </CardHeader>
        <CardContent>
          <RunForm
            products={products}
            boms={boms.map((b) => ({
              id: b.id,
              name: b.name,
              outputQty: b.outputQty.toString(),
              lines: b.lines.map((l) => ({ inputProductId: l.inputProductId, qty: l.qty.toString() })),
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
