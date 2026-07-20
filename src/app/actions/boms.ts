"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTenantDb, getTenantContext, requireRole } from "@/lib/tenant-db";
import { BomFormSchema, BomLineInputSchema, type BomFormState } from "@/lib/validations/bom";
import { parseJsonLines } from "@/lib/validations/parse-json-lines";

export async function createBom(
  _state: BomFormState,
  formData: FormData
): Promise<BomFormState> {
  const context = await getTenantContext();
  requireRole(context, ["OWNER", "MANAGER"]);

  const validated = BomFormSchema.safeParse(Object.fromEntries(formData));
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }
  const { name, outputProductId, outputQty, linesJson } = validated.data;

  const parsedLines = parseJsonLines(linesJson, BomLineInputSchema, "Add at least one input item.");
  if (!parsedLines.ok) {
    return { errors: { lines: [parsedLines.error] } };
  }

  const db = await getTenantDb();
  const outputProduct = await db.product.findUnique({ where: { id: outputProductId } });
  if (!outputProduct) {
    return { errors: { outputProductId: ["Select a valid output item."] } };
  }
  const inputIds = parsedLines.lines.map((l) => l.inputProductId);
  const ownedInputs = await db.product.findMany({ where: { id: { in: inputIds } }, select: { id: true } });
  if (ownedInputs.length !== new Set(inputIds).size) {
    return { errors: { lines: ["One or more input items are invalid."] } };
  }

  await db.$transaction(async (tx) => {
    // Only one active BOM per output item — deactivate the rest.
    await tx.bom.updateMany({
      where: { outputProductId, isActive: true },
      data: { isActive: false },
    });

    await tx.bom.create({
      data: {
        tenantId: context.tenantId,
        name,
        outputProductId,
        outputQty,
        isActive: true,
        lines: {
          create: parsedLines.lines.map((l) => ({
            tenantId: context.tenantId,
            inputProductId: l.inputProductId,
            qty: l.qty,
            wastagePercent: l.wastagePercent,
          })),
        },
      },
    });
  });

  revalidatePath("/dashboard/production/boms");
  redirect("/dashboard/production/boms");
}

export async function updateBom(
  bomId: string,
  _state: BomFormState,
  formData: FormData
): Promise<BomFormState> {
  const context = await getTenantContext();
  requireRole(context, ["OWNER", "MANAGER"]);

  const validated = BomFormSchema.safeParse(Object.fromEntries(formData));
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }
  const { name, outputProductId, outputQty, linesJson } = validated.data;

  const parsedLines = parseJsonLines(linesJson, BomLineInputSchema, "Add at least one input item.");
  if (!parsedLines.ok) {
    return { errors: { lines: [parsedLines.error] } };
  }

  const db = await getTenantDb();
  const existing = await db.bom.findUnique({ where: { id: bomId } });
  if (!existing) {
    return { message: "BOM not found." };
  }
  const inputIds = parsedLines.lines.map((l) => l.inputProductId);
  const ownedInputs = await db.product.findMany({ where: { id: { in: inputIds } }, select: { id: true } });
  if (ownedInputs.length !== new Set(inputIds).size) {
    return { errors: { lines: ["One or more input items are invalid."] } };
  }

  await db.$transaction(async (tx) => {
    if (existing.isActive) {
      await tx.bom.updateMany({
        where: { outputProductId, isActive: true, NOT: { id: bomId } },
        data: { isActive: false },
      });
    }

    await tx.bomLine.deleteMany({ where: { bomId } });
    await tx.bom.update({
      where: { id: bomId },
      data: {
        name,
        outputProductId,
        outputQty,
        lines: {
          create: parsedLines.lines.map((l) => ({
            tenantId: context.tenantId,
            inputProductId: l.inputProductId,
            qty: l.qty,
            wastagePercent: l.wastagePercent,
          })),
        },
      },
    });
  });

  revalidatePath("/dashboard/production/boms");
  revalidatePath(`/dashboard/production/boms/${bomId}`);
  redirect("/dashboard/production/boms");
}

export async function setBomActive(
  bomId: string,
  isActive: boolean
): Promise<{ ok: true } | { ok: false; message: string }> {
  const context = await getTenantContext();
  requireRole(context, ["OWNER", "MANAGER"]);

  const db = await getTenantDb();
  const bom = await db.bom.findUnique({ where: { id: bomId } });
  if (!bom) return { ok: false, message: "BOM not found." };

  await db.$transaction(async (tx) => {
    if (isActive) {
      await tx.bom.updateMany({
        where: { outputProductId: bom.outputProductId, isActive: true, NOT: { id: bomId } },
        data: { isActive: false },
      });
    }
    await tx.bom.update({ where: { id: bomId }, data: { isActive } });
  });

  revalidatePath("/dashboard/production/boms");
  return { ok: true };
}
