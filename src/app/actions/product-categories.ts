"use server";

import { revalidatePath } from "next/cache";
import { getTenantDb, getTenantContext, requireRole } from "@/lib/tenant-db";
import { ProductCategorySchema } from "@/lib/validations/product-category";

export async function createProductCategory(
  name: string
): Promise<
  { ok: true; category: { id: string; name: string } } | { ok: false; message: string }
> {
  const context = await getTenantContext();
  requireRole(context, ["OWNER", "MANAGER", "CASHIER"]);

  const result = ProductCategorySchema.safeParse({ name });
  if (!result.success) {
    return { ok: false, message: result.error.issues[0]?.message ?? "Invalid category name." };
  }

  const db = await getTenantDb();
  const existing = await db.productCategory.findFirst({ where: { name: result.data.name } });
  if (existing) {
    return { ok: true, category: { id: existing.id, name: existing.name } };
  }

  const category = await db.productCategory.create({
    data: { name: result.data.name, tenantId: context.tenantId },
  });

  revalidatePath("/dashboard/products");
  return { ok: true, category: { id: category.id, name: category.name } };
}
