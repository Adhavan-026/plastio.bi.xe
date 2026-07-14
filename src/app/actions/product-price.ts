"use server";

import { revalidatePath } from "next/cache";
import { getTenantDb, getTenantContext, requireRole } from "@/lib/tenant-db";
import {
  ProductPriceSchema,
  type ProductPriceState,
  type ProductPriceLogEntry,
} from "@/lib/validations/product-price";

export async function updateProductPrice(
  _state: ProductPriceState,
  formData: FormData
): Promise<ProductPriceState> {
  const context = await getTenantContext();
  requireRole(context, ["OWNER", "MANAGER"]);

  const productId = formData.get("productId");
  if (typeof productId !== "string" || !productId) {
    return { message: "Product not found." };
  }

  const validatedFields = ProductPriceSchema.safeParse(Object.fromEntries(formData));
  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }
  const { purchasePrice, sellingPrice } = validatedFields.data;

  const db = await getTenantDb();
  const existing = await db.product.findUnique({ where: { id: productId } });
  if (!existing) {
    return { message: "Product not found." };
  }

  await db.$transaction(async (tx) => {
    await tx.product.update({
      where: { id: productId },
      data: { purchasePrice, sellingPrice },
    });
    await tx.productPriceLog.create({
      data: { tenantId: context.tenantId, productId, purchasePrice, sellingPrice },
    });
  });

  revalidatePath("/dashboard/products");
  return { ok: true };
}

export async function getProductPriceLog(productId: string): Promise<ProductPriceLogEntry[]> {
  const context = await getTenantContext();
  requireRole(context, ["OWNER", "MANAGER", "CASHIER"]);

  const db = await getTenantDb();
  const log = await db.productPriceLog.findMany({
    where: { productId },
    orderBy: { changedAt: "desc" },
  });

  return log.map((entry) => ({
    id: entry.id,
    purchasePrice: entry.purchasePrice.toString(),
    sellingPrice: entry.sellingPrice.toString(),
    changedAt: entry.changedAt.toISOString(),
  }));
}
