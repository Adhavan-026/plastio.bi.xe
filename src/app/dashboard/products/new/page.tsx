import { getTenantContext, getTenantDb } from "@/lib/tenant-db";
import { prisma } from "@/lib/prisma";
import { requireActiveSubscription } from "@/lib/billing/subscription";
import { BackButton } from "@/components/dashboard/back-button";
import { ProductBulkForm } from "../product-bulk-form";

export default async function NewProductPage() {
  await requireActiveSubscription();
  const { tenantId } = await getTenantContext();
  const db = await getTenantDb();
  const [tenant, categories, existingProducts] = await Promise.all([
    prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      select: { businessType: true },
    }),
    db.productCategory.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.product.findMany({ select: { tyreSize: true, tyreBrand: true } }),
  ]);

  const existingSizes = Array.from(
    new Set(existingProducts.map((p) => p.tyreSize).filter((s): s is string => !!s))
  ).sort();
  const existingBrands = Array.from(
    new Set(existingProducts.map((p) => p.tyreBrand).filter((b): b is string => !!b))
  ).sort();

  return (
    <div className="flex flex-col gap-6">
      <BackButton />
      <h1 className="text-2xl font-semibold">Add products</h1>
      <ProductBulkForm
        showTyreFields={tenant.businessType === "TYRE"}
        categories={categories}
        existingSizes={existingSizes}
        existingBrands={existingBrands}
      />
    </div>
  );
}
