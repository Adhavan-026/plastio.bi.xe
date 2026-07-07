"use server";

import { revalidatePath } from "next/cache";
import { getTenantDb, getTenantContext, requireRole } from "@/lib/tenant-db";
import {
  StockAdjustmentFormSchema,
  type StockAdjustmentFormState,
} from "@/lib/validations/stock-adjustment";

export async function createStockAdjustment(
  _state: StockAdjustmentFormState,
  formData: FormData
): Promise<StockAdjustmentFormState> {
  const context = await getTenantContext();
  requireRole(context, ["OWNER", "MANAGER"]);

  const validatedFields = StockAdjustmentFormSchema.safeParse(Object.fromEntries(formData));
  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { productId, quantityChange, reason, notes } = validatedFields.data;

  const db = await getTenantDb();
  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) {
    return { errors: { productId: ["Select a valid product."] } };
  }

  if (Number(product.stockQty) + quantityChange < 0) {
    return { errors: { quantityChange: ["This would take stock below zero."] } };
  }

  await db.$transaction(async (tx) => {
    await tx.stockAdjustment.create({
      data: {
        tenantId: context.tenantId,
        productId,
        quantityChange,
        reason,
        notes: notes || null,
        createdByUserId: context.userId,
      },
    });

    await tx.product.update({
      where: { id: productId },
      data: { stockQty: { increment: quantityChange } },
    });
  });

  revalidatePath(`/dashboard/products/${productId}/adjust-stock`);
  revalidatePath("/dashboard/products");
  return { message: "Stock updated." };
}
