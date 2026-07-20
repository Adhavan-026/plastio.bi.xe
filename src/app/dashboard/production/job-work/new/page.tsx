import { getTenantDb } from "@/lib/tenant-db";
import { requireActiveSubscription } from "@/lib/billing/subscription";
import { BackButton } from "@/components/dashboard/back-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OutwardChallanForm } from "../outward-challan-form";

export default async function NewOutwardChallanPage() {
  await requireActiveSubscription();
  const db = await getTenantDb();

  const [products, jobWorkers] = await Promise.all([
    db.product.findMany({ where: { isActive: true }, select: { id: true, name: true, unit: true }, orderBy: { name: "asc" } }),
    db.party.findMany({ where: { isJobWorker: true, isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <BackButton />
      <h1 className="text-2xl font-semibold">New outward challan</h1>
      <Card>
        <CardHeader>
          <CardTitle>Goods sent for job work</CardTitle>
        </CardHeader>
        <CardContent>
          <OutwardChallanForm products={products} jobWorkers={jobWorkers} />
        </CardContent>
      </Card>
    </div>
  );
}
