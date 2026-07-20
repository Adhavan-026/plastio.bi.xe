import "server-only";
import { Prisma } from "@/generated/prisma/client";
import {
  recordStockMovement,
  transferStockBucket,
  checkSufficientStock,
  InsufficientStockError,
  type StockMovementTx,
} from "@/lib/stock/stock-movement";
import {
  computeYieldPercent,
  checkOutputNotOverInput,
  checkUnaccountedLoss,
  checkWastageExceeded,
} from "@/lib/production/yield";

const { Decimal } = Prisma;
type DecimalT = InstanceType<typeof Decimal>;
type DecimalInput = DecimalT | number | string;

// Orchestrates the status flow described in PRODUCTION_MODULE.md, on top of
// the low-level primitives in src/lib/stock/stock-movement.ts. Each function
// here is meant to run inside the caller's db.$transaction(async (tx) => …)
// block, same as every other multi-step write in this app.
//
// Extends StockMovementTx (rather than redeclaring product/stockLedger
// separately) so a tx satisfying this type is guaranteed to also satisfy
// what recordStockMovement()/transferStockBucket() need — see the
// contravariance note in stock-movement.ts for why the field shapes here
// have to be precise, not Record<string, unknown>.
type Tx = StockMovementTx & {
  product: {
    findMany: (args: {
      where: { id: { in: string[] } };
      select?: Record<string, boolean>;
    }) => Promise<Record<string, unknown>[]>;
  };
  productionInput: {
    findMany: (args: {
      where: { runId: string };
    }) => Promise<{ id: string; productId: string; qty: DecimalT; unitCost: DecimalT }[]>;
    update: (args: {
      where: { id: string };
      data: { unitCost: DecimalInput };
    }) => Promise<unknown>;
  };
  productionOutput: {
    createMany: (args: {
      data: {
        tenantId: string;
        runId: string;
        productId: string;
        qty: DecimalInput;
        outputType: string;
      }[];
    }) => Promise<unknown>;
  };
  productionRun: {
    update: (args: {
      where: { id: string };
      data: Partial<{
        status: string;
        startedAt: Date;
        completedAt: Date;
        yieldPercent: DecimalT | null;
        wastageExceeded: boolean;
      }>;
    }) => Promise<unknown>;
  };
};

async function getUnitsByProductId(tx: Tx, productIds: string[]): Promise<Map<string, string>> {
  const uniqueIds = [...new Set(productIds)];
  const products = await tx.product.findMany({
    where: { id: { in: uniqueIds } },
    select: { id: true, unit: true },
  });
  return new Map(products.map((p) => [p.id as string, p.unit as string]));
}

export class RunStatusError extends Error {}

/**
 * DRAFT -> IN_PROGRESS. Checks stock for every input up front (so a run
 * either starts cleanly or not at all), then moves each input's quantity
 * from ON_HAND to WIP and re-stamps unitCost at the actual moment of issue.
 */
export async function startProductionRun(
  tx: Tx,
  params: { tenantId: string; runId: string }
): Promise<void> {
  const inputs = await tx.productionInput.findMany({ where: { runId: params.runId } });

  const shortageError = await checkSufficientStock(
    tx,
    inputs.map((i) => ({ productId: i.productId, bucket: "ON_HAND" as const, qty: i.qty }))
  );
  if (shortageError) throw shortageError;

  for (const input of inputs) {
    const product = await tx.product.findUnique({
      where: { id: input.productId },
      select: { purchasePrice: true },
    });

    await transferStockBucket(tx, {
      tenantId: params.tenantId,
      productId: input.productId,
      fromBucket: "ON_HAND",
      toBucket: "WIP",
      qty: input.qty,
      reason: "PRODUCTION_ISSUE",
      refType: "ProductionRun",
      refId: params.runId,
    });

    await tx.productionInput.update({
      where: { id: input.id },
      data: { unitCost: (product?.purchasePrice as DecimalT | undefined) ?? 0 },
    });
  }

  await tx.productionRun.update({
    where: { id: params.runId },
    data: { status: "IN_PROGRESS", startedAt: new Date() },
  });
}

export type CompleteOutputLine = { productId: string; qty: DecimalT | number; outputType: string };

/**
 * IN_PROGRESS -> COMPLETED. Deducts WIP for every input (fully consumed),
 * credits ON_HAND for FINISHED/BYPRODUCT outputs, records WASTAGE rows for
 * reporting only (no stock effect), computes yieldPercent, and flags
 * wastageExceeded against the tenant's configured threshold.
 *
 * Returns a non-blocking warning string when output is >2% below input
 * (Feature 4's "unaccounted loss" check) — the run still completes.
 */
export async function completeProductionRun(
  tx: Tx,
  params: {
    tenantId: string;
    runId: string;
    maxWastagePercent: DecimalT;
    outputs: CompleteOutputLine[];
  }
): Promise<{ warning: string | null }> {
  const inputs = await tx.productionInput.findMany({ where: { runId: params.runId } });

  const unitsByProductId = await getUnitsByProductId(tx, [
    ...inputs.map((i) => i.productId),
    ...params.outputs.map((o) => o.productId),
  ]);

  const inputRows = inputs.map((i) => ({
    qty: new Decimal(i.qty),
    unit: unitsByProductId.get(i.productId) ?? "",
  }));
  const outputRows = params.outputs.map((o) => ({
    qty: new Decimal(o.qty),
    unit: unitsByProductId.get(o.productId) ?? "",
  }));
  const finishedRows = params.outputs
    .filter((o) => o.outputType === "FINISHED")
    .map((o) => ({ qty: new Decimal(o.qty), unit: unitsByProductId.get(o.productId) ?? "" }));
  const wastageRows = params.outputs
    .filter((o) => o.outputType === "WASTAGE")
    .map((o) => ({ qty: new Decimal(o.qty), unit: unitsByProductId.get(o.productId) ?? "" }));

  const overInputError = checkOutputNotOverInput(inputRows, outputRows);
  if (overInputError) throw new RunStatusError(overInputError);

  const warning = checkUnaccountedLoss(inputRows, outputRows);
  const yieldPercent = computeYieldPercent(inputRows, finishedRows);
  const wastageExceeded = checkWastageExceeded(inputRows, wastageRows, params.maxWastagePercent);

  // Consume WIP for every input — it's been fully converted into whatever
  // outputs (and wastage) resulted, regardless of which specific output
  // line it became.
  for (const input of inputs) {
    await recordStockMovement(tx, {
      tenantId: params.tenantId,
      productId: input.productId,
      bucket: "WIP",
      qty: new Decimal(input.qty).negated(),
      reason: "PRODUCTION_OUTPUT",
      refType: "ProductionRun",
      refId: params.runId,
    });
  }

  // Credit stock for real outputs only — WASTAGE rows are recorded on the
  // run (via ProductionOutput below) but never touch any stock bucket.
  for (const output of params.outputs) {
    if (output.outputType === "WASTAGE") continue;
    await recordStockMovement(tx, {
      tenantId: params.tenantId,
      productId: output.productId,
      bucket: "ON_HAND",
      qty: output.qty,
      reason: "PRODUCTION_OUTPUT",
      refType: "ProductionRun",
      refId: params.runId,
    });
  }

  await tx.productionOutput.createMany({
    data: params.outputs.map((o) => ({
      tenantId: params.tenantId,
      runId: params.runId,
      productId: o.productId,
      qty: o.qty,
      outputType: o.outputType,
    })),
  });

  await tx.productionRun.update({
    where: { id: params.runId },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
      yieldPercent,
      wastageExceeded,
    },
  });

  return { warning };
}

/**
 * DRAFT/IN_PROGRESS -> CANCELLED. A DRAFT run never touched stock, so
 * cancelling it is a no-op status flip. An IN_PROGRESS run reverses the
 * WIP issue, moving each input's quantity back from WIP to ON_HAND.
 */
export async function cancelProductionRun(
  tx: Tx,
  params: { tenantId: string; runId: string; currentStatus: string }
): Promise<void> {
  if (params.currentStatus === "IN_PROGRESS") {
    const inputs = await tx.productionInput.findMany({ where: { runId: params.runId } });
    for (const input of inputs) {
      await transferStockBucket(tx, {
        tenantId: params.tenantId,
        productId: input.productId,
        fromBucket: "WIP",
        toBucket: "ON_HAND",
        qty: input.qty,
        reason: "PRODUCTION_ISSUE",
        refType: "ProductionRun",
        refId: params.runId,
      });
    }
  }

  await tx.productionRun.update({
    where: { id: params.runId },
    data: { status: "CANCELLED" },
  });
}

export { InsufficientStockError };
