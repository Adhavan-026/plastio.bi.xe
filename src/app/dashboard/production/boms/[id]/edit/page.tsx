import { notFound } from "next/navigation";
import { getTenantDb } from "@/lib/tenant-db";
import { requireActiveSubscription } from "@/lib/billing/subscription";
import { BackButton } from "@/components/dashboard/back-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BomForm } from "../../bom-form";

export default async function EditBomPage({ params }: { params: Promise<{ id: string }> }) {
  await requireActiveSubscription();
  const { id } = await params;
  const db = await getTenantDb();

  const [bom, products] = await Promise.all([
    db.bom.findUnique({ where: { id }, include: { lines: true } }),
    db.product.findMany({ where: { isActive: true }, select: { id: true, name: true, unit: true }, orderBy: { name: "asc" } }),
  ]);
  if (!bom) notFound();

  return (
    <div className="flex flex-col gap-6">
      <BackButton />
      <h1 className="text-2xl font-semibold">Edit BOM</h1>
      <Card>
        <CardHeader>
          <CardTitle>{bom.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <BomForm
            products={products}
            bomId={bom.id}
            defaultValues={{
              name: bom.name,
              outputProductId: bom.outputProductId,
              outputQty: bom.outputQty.toString(),
              lines: bom.lines.map((l) => ({
                inputProductId: l.inputProductId,
                qty: l.qty.toString(),
                wastagePercent: l.wastagePercent.toString(),
              })),
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
