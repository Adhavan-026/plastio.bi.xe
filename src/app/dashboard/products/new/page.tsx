import { getTenantContext, getTenantDb } from "@/lib/tenant-db";
import { prisma } from "@/lib/prisma";
import { requireActiveSubscription } from "@/lib/billing/subscription";
import { BackButton } from "@/components/dashboard/back-button";
import { ProductBulkForm } from "../product-bulk-form";

export default async function NewProductPage() {
  await requireActiveSubscription();
  const { tenantId } = await getTenantContext();
  const db = await getTenantDb();
  const [tenant, categories] = await Promise.all([
    prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      select: { businessType: true },
    }),
    db.productCategory.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <BackButton />
      <h1 className="text-2xl font-semibold">Add products</h1>
      <ProductBulkForm showTyreFields={tenant.businessType === "TYRE"} categories={categories} />
    </div>
  );
}
