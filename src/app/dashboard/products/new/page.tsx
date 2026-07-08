import { getTenantContext } from "@/lib/tenant-db";
import { prisma } from "@/lib/prisma";
import { createProduct } from "@/app/actions/products";
import { ProductForm } from "../product-form";

export default async function NewProductPage() {
  const { tenantId } = await getTenantContext();
  const tenant = await prisma.tenant.findUniqueOrThrow({
    where: { id: tenantId },
    select: { businessType: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Add product</h1>
      <ProductForm
        action={createProduct}
        submitLabel="Create product"
        showTyreFields={tenant.businessType === "TYRE"}
      />
    </div>
  );
}
