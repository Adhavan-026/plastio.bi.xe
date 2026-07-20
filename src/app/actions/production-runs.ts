"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTenantDb, getTenantContext, requireRole } from "@/lib/tenant-db";
import { getNextRunNumber } from "@/lib/production/numbering";
import {
  startProductionRun,
  completeProductionRun,
  cancelProductionRun,
  RunStatusError,
} from "@/lib/production/production-run-transitions";
import { InsufficientStockError } from "@/lib/stock/stock-movement";
import {
  ProductionRunFormSchema,
  ProductionInputLineSchema,
  ProductionOutputLineSchema,
  CompleteProductionRunSchema,
  type ProductionRunFormState,
  type CompleteProductionRunState,
} from "@/lib/validations/production-run";
import { parseJsonLines } from "@/lib/validations/parse-json-lines";

export async function createProductionRun(
  _state: ProductionRunFormState,
  formData: FormData
): Promise<ProductionRunFormState> {
  const context = await getTenantContext();
  requireRole(context, ["OWNER", "MANAGER"]);

  const validated = ProductionRunFormSchema.safeParse(Object.fromEntries(formData));
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }
  const { bomId, notes, inputsJson } = validated.data;

  const parsedInputs = parseJsonLines(inputsJson, ProductionInputLineSchema, "Add at least one input item.");
  if (!parsedInputs.ok) {
    return { errors: { inputs: [parsedInputs.error] } };
  }

  const db = await getTenantDb();

  if (bomId) {
    const bom = await db.bom.findUnique({ where: { id: bomId } });
    if (!bom) return { errors: { bomId: ["Select a valid BOM."] } };
  }

  const inputIds = parsedInputs.lines.map((l) => l.productId);
  const ownedInputs = await db.product.findMany({
    where: { id: { in: inputIds } },
    select: { id: true, purchasePrice: true },
  });
  if (ownedInputs.length !== new Set(inputIds).size) {
    return { errors: { inputs: ["One or more input items are invalid."] } };
  }
  const priceById = new Map(ownedInputs.map((p) => [p.id, p.purchasePrice]));

  const run = await db.$transaction(async (tx) => {
    const runNumber = await getNextRunNumber(tx, context.tenantId);
    return tx.productionRun.create({
      data: {
        tenantId: context.tenantId,
        runNumber,
        bomId: bomId || null,
        status: "DRAFT",
        notes: notes || null,
        createdByUserId: context.userId,
        inputs: {
          create: parsedInputs.lines.map((l) => ({
            tenantId: context.tenantId,
            productId: l.productId,
            qty: l.qty,
            unitCost: priceById.get(l.productId) ?? 0,
          })),
        },
      },
    });
  });

  revalidatePath("/dashboard/production/runs");
  redirect(`/dashboard/production/runs/${run.id}`);
}

export async function startProductionRunAction(
  runId: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const context = await getTenantContext();
  requireRole(context, ["OWNER", "MANAGER"]);

  const db = await getTenantDb();
  const run = await db.productionRun.findUnique({ where: { id: runId } });
  if (!run) return { ok: false, message: "Production run not found." };
  if (run.status !== "DRAFT") return { ok: false, message: "Only a draft run can be started." };

  try {
    await db.$transaction((tx) => startProductionRun(tx, { tenantId: context.tenantId, runId }));
  } catch (e) {
    if (e instanceof InsufficientStockError) return { ok: false, message: e.message };
    throw e;
  }

  revalidatePath("/dashboard/production/runs");
  revalidatePath(`/dashboard/production/runs/${runId}`);
  return { ok: true };
}

export async function completeProductionRunAction(
  _state: CompleteProductionRunState,
  formData: FormData
): Promise<CompleteProductionRunState> {
  const context = await getTenantContext();
  requireRole(context, ["OWNER", "MANAGER"]);

  const validated = CompleteProductionRunSchema.safeParse(Object.fromEntries(formData));
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }
  const { runId, outputsJson } = validated.data;

  const parsedOutputs = parseJsonLines(outputsJson, ProductionOutputLineSchema, "Add at least one output line.");
  if (!parsedOutputs.ok) {
    return { message: parsedOutputs.error };
  }

  const db = await getTenantDb();
  const run = await db.productionRun.findUnique({ where: { id: runId } });
  if (!run) return { message: "Production run not found." };
  if (run.status !== "IN_PROGRESS") return { message: "Only an in-progress run can be completed." };

  const outputIds = parsedOutputs.lines.map((o) => o.productId);
  const ownedOutputs = await db.product.findMany({ where: { id: { in: outputIds } }, select: { id: true } });
  if (ownedOutputs.length !== new Set(outputIds).size) {
    return { message: "One or more output items are invalid." };
  }

  const tenant = await prisma.tenant.findUniqueOrThrow({
    where: { id: context.tenantId },
    select: { maxWastagePercent: true },
  });

  try {
    const { warning } = await db.$transaction((tx) =>
      completeProductionRun(tx, {
        tenantId: context.tenantId,
        runId,
        maxWastagePercent: tenant.maxWastagePercent,
        outputs: parsedOutputs.lines,
      })
    );

    revalidatePath("/dashboard/production/runs");
    revalidatePath(`/dashboard/production/runs/${runId}`);
    return { message: "Production run completed.", warning: warning ?? undefined };
  } catch (e) {
    if (e instanceof RunStatusError) return { message: e.message };
    throw e;
  }
}

export async function cancelProductionRunAction(
  runId: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const context = await getTenantContext();
  requireRole(context, ["OWNER", "MANAGER"]);

  const db = await getTenantDb();
  const run = await db.productionRun.findUnique({ where: { id: runId } });
  if (!run) return { ok: false, message: "Production run not found." };
  if (run.status !== "DRAFT" && run.status !== "IN_PROGRESS") {
    return { ok: false, message: "Only a draft or in-progress run can be cancelled." };
  }

  await db.$transaction((tx) =>
    cancelProductionRun(tx, { tenantId: context.tenantId, runId, currentStatus: run.status })
  );

  revalidatePath("/dashboard/production/runs");
  revalidatePath(`/dashboard/production/runs/${runId}`);
  return { ok: true };
}
