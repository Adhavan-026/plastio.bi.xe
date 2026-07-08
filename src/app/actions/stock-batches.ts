"use server";

import { revalidatePath } from "next/cache";
import { getTenantDb, getTenantContext, requireRole } from "@/lib/tenant-db";
import { StockBatchFormSchema, type StockBatchFormState } from "@/lib/validations/stock-batch";

export async function createStockBatch(
  _state: StockBatchFormState,
  formData: FormData
): Promise<StockBatchFormState> {
  const context = await getTenantContext();
  requireRole(context, ["OWNER", "MANAGER"]);

  const validatedFields = StockBatchFormSchema.safeParse(Object.fromEntries(formData));
  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { productId, batchNumber, mfgDate, expiryDate, quantity, purchasePrice } =
    validatedFields.data;

  const db = await getTenantDb();
  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) {
    return { errors: { productId: ["Select a valid product."] } };
  }

  await db.$transaction(async (tx) => {
    await tx.stockBatch.create({
      data: {
        tenantId: context.tenantId,
        productId,
        batchNumber,
        mfgDate: mfgDate ? new Date(mfgDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        quantity,
        purchasePrice,
      },
    });

    await tx.product.update({
      where: { id: productId },
      data: { stockQty: { increment: quantity } },
    });
  });

  revalidatePath(`/dashboard/products/${productId}/batches`);
  revalidatePath("/dashboard/products");
  return { message: "Batch added." };
}
