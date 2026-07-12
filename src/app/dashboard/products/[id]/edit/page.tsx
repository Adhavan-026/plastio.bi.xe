import { notFound } from "next/navigation";
import { getTenantDb, getTenantContext } from "@/lib/tenant-db";
import { prisma } from "@/lib/prisma";
import { updateProduct } from "@/app/actions/products";
import { BackButton } from "@/components/dashboard/back-button";
import { ProductForm } from "../../product-form";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { tenantId } = await getTenantContext();
  const db = await getTenantDb();
  const [product, tenant] = await Promise.all([
    db.product.findUnique({ where: { id } }),
    prisma.tenant.findUniqueOrThrow({ where: { id: tenantId }, select: { businessType: true } }),
  ]);

  if (!product) notFound();

  return (
    <div className="flex flex-col gap-6">
      <BackButton />
      <h1 className="text-2xl font-semibold">Edit product</h1>
      <ProductForm
        action={updateProduct.bind(null, product.id)}
        defaultValues={{
          name: product.name,
          hsnCode: product.hsnCode,
          unit: product.unit,
          category: product.category,
          gstRate: product.gstRate.toString(),
          purchasePrice: product.purchasePrice.toString(),
          sellingPrice: product.sellingPrice.toString(),
          stockQty: product.stockQty.toString(),
          lowStockAlert: product.lowStockAlert.toString(),
          tyreBrand: product.tyreBrand,
          tyreSize: product.tyreSize,
          tyrePattern: product.tyrePattern,
          tyreLoadIndex: product.tyreLoadIndex,
        }}
        submitLabel="Save changes"
        showTyreFields={tenant.businessType === "TYRE"}
      />
    </div>
  );
}
