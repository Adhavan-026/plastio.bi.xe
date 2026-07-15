import { notFound } from "next/navigation";
import { getTenantDb, getTenantContext } from "@/lib/tenant-db";
import { prisma } from "@/lib/prisma";
import { updateProduct } from "@/app/actions/products";
import { requireActiveSubscription } from "@/lib/billing/subscription";
import { BackButton } from "@/components/dashboard/back-button";
import { ProductForm } from "../../product-form";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireActiveSubscription();
  const { id } = await params;
  const { tenantId } = await getTenantContext();
  const db = await getTenantDb();
  const [product, tenant, categories, existingProducts] = await Promise.all([
    db.product.findUnique({ where: { id } }),
    prisma.tenant.findUniqueOrThrow({ where: { id: tenantId }, select: { businessType: true } }),
    db.productCategory.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.product.findMany({ select: { tyreSize: true, tyreBrand: true } }),
  ]);

  if (!product) notFound();

  const existingSizes = Array.from(
    new Set(existingProducts.map((p) => p.tyreSize).filter((s): s is string => !!s && s !== product.tyreSize))
  ).sort();
  const existingBrands = Array.from(
    new Set(existingProducts.map((p) => p.tyreBrand).filter((b): b is string => !!b && b !== product.tyreBrand))
  ).sort();

  return (
    <div className="flex flex-col gap-6">
      <BackButton />
      <h1 className="text-2xl font-semibold">Edit product</h1>
      <ProductForm
        action={updateProduct.bind(null, product.id)}
        categories={categories}
        existingSizes={existingSizes}
        existingBrands={existingBrands}
        defaultValues={{
          name: product.name,
          hsnCode: product.hsnCode,
          unit: product.unit,
          category: product.category,
          categoryId: product.categoryId,
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
