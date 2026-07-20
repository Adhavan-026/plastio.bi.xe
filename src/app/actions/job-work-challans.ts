"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { getTenantDb, getTenantContext, requireRole } from "@/lib/tenant-db";
import { getNextChallanNumber } from "@/lib/production/numbering";
import { recordStockMovement, transferStockBucket, checkSufficientStock } from "@/lib/stock/stock-movement";
import {
  JobWorkChallanLineSchema,
  OutwardChallanFormSchema,
  InwardReturnFormSchema,
  type OutwardChallanFormState,
  type InwardReturnFormState,
} from "@/lib/validations/job-work-challan";
import { parseJsonLines } from "@/lib/validations/parse-json-lines";

const { Decimal } = Prisma;

export async function createOutwardChallan(
  _state: OutwardChallanFormState,
  formData: FormData
): Promise<OutwardChallanFormState> {
  const context = await getTenantContext();
  requireRole(context, ["OWNER", "MANAGER"]);

  const validated = OutwardChallanFormSchema.safeParse(Object.fromEntries(formData));
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }
  const { partyId, date, expectedReturnDate, notes, linesJson } = validated.data;

  const parsedLines = parseJsonLines(linesJson, JobWorkChallanLineSchema, "Add at least one item.");
  if (!parsedLines.ok) {
    return { errors: { lines: [parsedLines.error] } };
  }

  const db = await getTenantDb();
  const party = await db.party.findUnique({ where: { id: partyId } });
  if (!party || !party.isJobWorker) {
    return { errors: { partyId: ["Select a party marked as a job worker."] } };
  }

  const productIds = parsedLines.lines.map((l) => l.productId);
  const ownedProducts = await db.product.findMany({ where: { id: { in: productIds } }, select: { id: true } });
  if (ownedProducts.length !== new Set(productIds).size) {
    return { errors: { lines: ["One or more items are invalid."] } };
  }

  try {
    const challan = await db.$transaction(async (tx) => {
      const shortageError = await checkSufficientStock(
        tx,
        parsedLines.lines.map((l) => ({ productId: l.productId, bucket: "ON_HAND" as const, qty: l.qty }))
      );
      if (shortageError) throw shortageError;

      const challanNumber = await getNextChallanNumber(tx, context.tenantId, new Date(date));
      const created = await tx.jobWorkChallan.create({
        data: {
          tenantId: context.tenantId,
          challanNumber,
          partyId,
          direction: "OUTWARD",
          date: new Date(date),
          expectedReturnDate: expectedReturnDate ? new Date(expectedReturnDate) : null,
          status: "OPEN",
          notes: notes || null,
          createdByUserId: context.userId,
          lines: {
            create: parsedLines.lines.map((l) => ({
              tenantId: context.tenantId,
              productId: l.productId,
              qty: l.qty,
              description: l.description || null,
            })),
          },
        },
      });

      for (const line of parsedLines.lines) {
        await transferStockBucket(tx, {
          tenantId: context.tenantId,
          productId: line.productId,
          fromBucket: "ON_HAND",
          toBucket: "WITH_JOB_WORKER",
          qty: line.qty,
          reason: "JOB_WORK_OUT",
          refType: "JobWorkChallan",
          refId: created.id,
        });
      }

      return created;
    });

    revalidatePath("/dashboard/production/job-work");
    redirect(`/dashboard/production/job-work/${challan.id}`);
  } catch (e) {
    if (e instanceof Error && e.name === "InsufficientStockError") {
      return { message: e.message };
    }
    throw e;
  }
}

/**
 * Returned goods against an outward challan. Products returned can differ
 * from what was sent (fabric out, shirts back) so lines aren't matched
 * 1:1 — instead this tracks progress at the CHALLAN level: total qty sent
 * vs. total qty returned across all linked inward challans. The
 * WITH_JOB_WORKER balance on the original sent items is reduced
 * proportionally to how much of the total outward quantity this return
 * represents. Documented as an approximation in PRODUCTION_MODULE.md —
 * exact per-line reconciliation across a transformation (fabric -> shirts)
 * isn't a well-defined problem without the job worker itself reporting
 * material consumption.
 */
export async function createInwardReturn(
  _state: InwardReturnFormState,
  formData: FormData
): Promise<InwardReturnFormState> {
  const context = await getTenantContext();
  requireRole(context, ["OWNER", "MANAGER"]);

  const validated = InwardReturnFormSchema.safeParse(Object.fromEntries(formData));
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }
  const { linkedChallanId, date, notes, linesJson } = validated.data;

  const parsedLines = parseJsonLines(linesJson, JobWorkChallanLineSchema, "Add at least one item.");
  if (!parsedLines.ok) {
    return { errors: { lines: [parsedLines.error] } };
  }

  const db = await getTenantDb();
  const outward = await db.jobWorkChallan.findUnique({
    where: { id: linkedChallanId },
    include: { lines: true },
  });
  if (!outward || outward.direction !== "OUTWARD") {
    return { errors: { linkedChallanId: ["Select a valid outward challan."] } };
  }
  if (outward.status === "CLOSED") {
    return { errors: { linkedChallanId: ["This challan is already fully returned."] } };
  }

  const productIds = parsedLines.lines.map((l) => l.productId);
  const ownedProducts = await db.product.findMany({ where: { id: { in: productIds } }, select: { id: true } });
  if (ownedProducts.length !== new Set(productIds).size) {
    return { errors: { lines: ["One or more items are invalid."] } };
  }

  const outwardTotalQty = outward.lines.reduce((sum, l) => sum.plus(l.qty), new Decimal(0));
  const priorInward = await db.jobWorkChallan.findMany({
    where: { linkedChallanId, direction: "INWARD" },
    include: { lines: true },
  });
  const priorReturnedQty = priorInward
    .flatMap((c) => c.lines)
    .reduce((sum, l) => sum.plus(l.qty), new Decimal(0));

  const thisReturnQty = parsedLines.lines.reduce((sum, l) => sum.plus(l.qty), new Decimal(0));
  const pendingQty = outwardTotalQty.minus(priorReturnedQty);
  if (thisReturnQty.greaterThan(pendingQty)) {
    return {
      message: `Return quantity (${thisReturnQty.toString()}) exceeds the pending quantity (${pendingQty.toString()}) on this challan.`,
    };
  }

  const totalReturnedAfter = priorReturnedQty.plus(thisReturnQty);
  const newStatus = totalReturnedAfter.greaterThanOrEqualTo(outwardTotalQty)
    ? "CLOSED"
    : "PARTIALLY_RETURNED";

  // Proportional share of THIS return against the outward challan's own
  // WITH_JOB_WORKER balances — capped per line so an over-return can't push
  // a balance negative.
  const shareOfTotal = outwardTotalQty.isZero() ? new Decimal(0) : thisReturnQty.div(outwardTotalQty);

  await db.$transaction(async (tx) => {
    const challanNumber = await getNextChallanNumber(tx, context.tenantId, new Date(date));
    const created = await tx.jobWorkChallan.create({
      data: {
        tenantId: context.tenantId,
        challanNumber,
        partyId: outward.partyId,
        direction: "INWARD",
        date: new Date(date),
        status: "CLOSED",
        linkedChallanId,
        notes: notes || null,
        createdByUserId: context.userId,
        lines: {
          create: parsedLines.lines.map((l) => ({
            tenantId: context.tenantId,
            productId: l.productId,
            qty: l.qty,
            description: l.description || null,
          })),
        },
      },
    });

    for (const outwardLine of outward.lines) {
      const releaseQty = new Decimal(outwardLine.qty).mul(shareOfTotal);
      if (releaseQty.isZero()) continue;
      await recordStockMovement(tx, {
        tenantId: context.tenantId,
        productId: outwardLine.productId,
        bucket: "WITH_JOB_WORKER",
        qty: releaseQty.negated(),
        reason: "JOB_WORK_IN",
        refType: "JobWorkChallan",
        refId: created.id,
      });
    }

    for (const returnLine of parsedLines.lines) {
      await recordStockMovement(tx, {
        tenantId: context.tenantId,
        productId: returnLine.productId,
        bucket: "ON_HAND",
        qty: returnLine.qty,
        reason: "JOB_WORK_IN",
        refType: "JobWorkChallan",
        refId: created.id,
      });
    }

    await tx.jobWorkChallan.update({ where: { id: linkedChallanId }, data: { status: newStatus } });

    return created;
  });

  revalidatePath("/dashboard/production/job-work");
  revalidatePath(`/dashboard/production/job-work/${linkedChallanId}`);
  redirect(`/dashboard/production/job-work/${linkedChallanId}`);
}
