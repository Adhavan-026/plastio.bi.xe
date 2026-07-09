import { getTenantContext } from "@/lib/tenant-db";
import { prisma } from "@/lib/prisma";
import { ProductBulkForm } from "../product-bulk-form";

export default async function NewProductPage() {
  const { tenantId } = await getTenantContext();
  const tenant = await prisma.tenant.findUniqueOrThrow({
    where: { id: tenantId },
    select: { businessType: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Add products</h1>
      <ProductBulkForm showTyreFields={tenant.businessType === "TYRE"} />
    </div>
  );
}
