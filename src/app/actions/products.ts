"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTenantDb, getTenantContext, requireRole } from "@/lib/tenant-db";
import {
  ProductFormSchema,
  ProductLineSchema,
  QuickProductSchema,
  type ProductFormState,
  type ProductBulkFormState,
  type QuickProductState,
} from "@/lib/validations/product";

/**
 * Creates a minimal product without redirecting, for the billing screen's
 * quick-add-item dialog — losing an in-progress invoice/purchase to a
 * navigation would defeat the point. New stock starts at 0; a purchase
 * that includes this product will increment it the normal way once saved.
 */
export async function quickCreateProduct(
  _state: QuickProductState,
  formData: FormData
): Promise<QuickProductState> {
  const context = await getTenantContext();
  requireRole(context, ["OWNER", "MANAGER", "CASHIER"]);

  const validatedFields = QuickProductSchema.safeParse(Object.fromEntries(formData));
  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const db = await getTenantDb();
  const { category, categoryId, tyreSize, tyreBrand, ...rest } = validatedFields.data;
  const product = await db.product.create({
    data: {
      ...rest,
      category: category || null,
      categoryId: categoryId || null,
      tyreSize: tyreSize || null,
      tyreBrand: tyreBrand || null,
      stockQty: 0,
      lowStockAlert: 0,
      tenantId: context.tenantId,
    },
  });

  revalidatePath("/dashboard/products");
  return {
    product: {
      id: product.id,
      name: product.name,
      unit: product.unit,
      gstRate: product.gstRate.toString(),
      sellingPrice: product.sellingPrice.toString(),
      purchasePrice: product.purchasePrice.toString(),
      stockQty: product.stockQty.toString(),
      category: product.category,
      categoryId: product.categoryId,
      tyreSize: product.tyreSize,
      tyreBrand: product.tyreBrand,
    },
  };
}

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
      categoryId: item.categoryId || null,
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
  const { hsnCode, category, categoryId, tyreBrand, tyreSize, tyrePattern, tyreLoadIndex, ...rest } =
    validatedFields.data;
  await db.product.create({
    data: {
      ...rest,
      hsnCode: hsnCode || null,
      category: category || null,
      categoryId: categoryId || null,
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
  const { hsnCode, category, categoryId, tyreBrand, tyreSize, tyrePattern, tyreLoadIndex, ...rest } =
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
      categoryId: categoryId || null,
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
