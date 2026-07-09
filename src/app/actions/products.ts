"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTenantDb, getTenantContext, requireRole } from "@/lib/tenant-db";
import {
  ProductFormSchema,
  ProductLineSchema,
  type ProductFormState,
  type ProductBulkFormState,
} from "@/lib/validations/product";

export async function createProducts(
  _state: ProductBulkFormState,
  formData: FormData
): Promise<ProductBulkFormState> {
  const context = await getTenantContext();
  requireRole(context, ["OWNER", "MANAGER"]);

  const itemsJson = formData.get("itemsJson");
  if (typeof itemsJson !== "string") {
    return { message: "No products to add." };
  }

  let rawItems: unknown;
  try {
    rawItems = JSON.parse(itemsJson);
  } catch {
    return { message: "Invalid product data." };
  }

  const itemsResult = z.array(ProductLineSchema).min(1, { error: "Add at least one product." }).safeParse(rawItems);
  if (!itemsResult.success) {
    const firstIssue = itemsResult.error.issues[0];
    const rowNumber = typeof firstIssue.path[0] === "number" ? firstIssue.path[0] + 1 : "?";
    return { message: `Row ${rowNumber}: ${firstIssue.message}` };
  }

  const db = await getTenantDb();
  await db.product.createMany({
    data: itemsResult.data.map((item) => ({
      tenantId: context.tenantId,
      name: item.name,
      hsnCode: item.hsnCode || null,
      unit: item.unit,
      category: item.category || null,
      gstRate: item.gstRate,
      purchasePrice: item.purchasePrice,
      sellingPrice: item.sellingPrice,
      stockQty: item.stockQty,
      lowStockAlert: item.lowStockAlert,
      tyreBrand: item.tyreBrand || null,
      tyreSize: item.tyreSize || null,
      tyrePattern: item.tyrePattern || null,
      tyreLoadIndex: item.tyreLoadIndex || null,
    })),
  });

  revalidatePath("/dashboard/products");
  redirect("/dashboard/products");
}

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
  const { hsnCode, category, tyreBrand, tyreSize, tyrePattern, tyreLoadIndex, ...rest } =
    validatedFields.data;
  await db.product.create({
    data: {
      ...rest,
      hsnCode: hsnCode || null,
      category: category || null,
      tyreBrand: tyreBrand || null,
      tyreSize: tyreSize || null,
      tyrePattern: tyrePattern || null,
      tyreLoadIndex: tyreLoadIndex || null,
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
  const { hsnCode, category, tyreBrand, tyreSize, tyrePattern, tyreLoadIndex, ...rest } =
    validatedFields.data;

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
      tyreBrand: tyreBrand || null,
      tyreSize: tyreSize || null,
      tyrePattern: tyrePattern || null,
      tyreLoadIndex: tyreLoadIndex || null,
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
