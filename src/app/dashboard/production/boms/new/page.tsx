import { getTenantDb } from "@/lib/tenant-db";
import { requireActiveSubscription } from "@/lib/billing/subscription";
import { BackButton } from "@/components/dashboard/back-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BomForm } from "../bom-form";

export default async function NewBomPage() {
  await requireActiveSubscription();
  const db = await getTenantDb();
  const products = await db.product.findMany({
    where: { isActive: true },
    select: { id: true, name: true, unit: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <BackButton />
      <h1 className="text-2xl font-semibold">New BOM</h1>
      <Card>
        <CardHeader>
          <CardTitle>Bill of Materials</CardTitle>
        </CardHeader>
        <CardContent>
          <BomForm products={products} />
        </CardContent>
      </Card>
    </div>
  );
}
