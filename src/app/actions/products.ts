"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTenantDb, getTenantContext, requireRole } from "@/lib/tenant-db";
import { ProductFormSchema, type ProductFormState } from "@/lib/validations/product";

export async function createProduct(
  _state: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  const context = await getTenantContext();
  requireRole(context, ["OWNER", "MANAGER"]);

  const validatedFields = ProductFormSchema.safeParse(Object.fromEntries(formData));
  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const db = await getTenantDb();
  const { hsnCode, category, ...rest } = validatedFields.data;
  await db.product.create({
    data: {
      ...rest,
      hsnCode: hsnCode || null,
      category: category || null,
      tenantId: context.tenantId,
    },
  });

  revalidatePath("/dashboard/products");
  redirect("/dashboard/products");
}

export async function updateProduct(
  productId: string,
  _state: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  const context = await getTenantContext();
  requireRole(context, ["OWNER", "MANAGER"]);

  const validatedFields = ProductFormSchema.safeParse(Object.fromEntries(formData));
  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const db = await getTenantDb();
  const { hsnCode, category, ...rest } = validatedFields.data;

  const existing = await db.product.findUnique({ where: { id: productId } });
  if (!existing) {
    return { message: "Product not found." };
  }

  await db.product.update({
    where: { id: productId },
    data: {
      ...rest,
      hsnCode: hsnCode || null,
      category: category || null,
    },
  });

  revalidatePath("/dashboard/products");
  redirect("/dashboard/products");
}

export async function toggleProductActive(productId: string, isActive: boolean) {
  const context = await getTenantContext();
  requireRole(context, ["OWNER", "MANAGER"]);

  const db = await getTenantDb();
  const existing = await db.product.findUnique({ where: { id: productId } });
  if (!existing) return;

  await db.product.update({ where: { id: productId }, data: { isActive } });
  revalidatePath("/dashboard/products");
}
