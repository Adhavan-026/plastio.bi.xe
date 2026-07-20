import "server-only";
import { Prisma } from "@/generated/prisma/client";

const { Decimal } = Prisma;
type DecimalT = InstanceType<typeof Decimal>;
type DecimalInput = DecimalT | number | string;

// The one place stock math happens. Every stockQty/wipQty/qtyWithJobWorker
// change — from Production runs, job work challans, or anywhere else in the
// future — goes through recordStockMovement() so there's exactly one code
// path to get right, and one auditable StockLedger row per balance changed.
//
// Existing billing code (invoices, purchases, StockAdjustment) still writes
// stockQty directly and is NOT retrofitted here — that's a separate,
// higher-risk refactor of already-working billing flows, out of scope for
// adding the Production module. Everything new (production, job work) uses
// this service exclusively.

export type StockBucket = "ON_HAND" | "WIP" | "WITH_JOB_WORKER";

export type StockMovementReason =
  | "PURCHASE"
  | "SALE"
  | "PRODUCTION_ISSUE"
  | "PRODUCTION_OUTPUT"
  | "WASTAGE"
  | "JOB_WORK_OUT"
  | "JOB_WORK_IN"
  | "ADJUSTMENT";

export type StockRefType = "Invoice" | "ProductionRun" | "JobWorkChallan" | "StockAdjustment";

const BUCKET_FIELD = {
  ON_HAND: "stockQty",
  WIP: "wipQty",
  WITH_JOB_WORKER: "qtyWithJobWorker",
} as const satisfies Record<StockBucket, string>;

export class InsufficientStockError extends Error {
  constructor(
    public readonly shortages: {
      productId: string;
      productName: string;
      bucket: StockBucket;
      available: DecimalT;
      required: DecimalT;
      shortBy: DecimalT;
    }[]
  ) {
    const summary = shortages
      .map((s) => `${s.productName}: short by ${s.shortBy.toString()}`)
      .join("; ");
    super(`Insufficient stock — ${summary}`);
    this.name = "InsufficientStockError";
  }
}

// Duck-typed against the tenant-scoped transaction client (see
// src/lib/tenant-db.ts) — matches the pattern already used by
// src/lib/billing/invoice-number.ts for the same reason: the extended
// client's generated types aren't structurally assignable between call
// sites, but every caller's `tx` satisfies this shape.
type Tx = {
  product: {
    findUnique: (args: {
      where: { id: string };
      select?: Record<string, boolean>;
    }) => Promise<Record<string, unknown> | null>;
    update: (args: {
      where: { id: string };
      data: Record<string, unknown>;
    }) => Promise<unknown>;
  };
  stockLedger: {
    create: (args: { data: Record<string, unknown> }) => Promise<unknown>;
  };
};

/**
 * Adjusts one stock bucket on one product and writes the matching
 * StockLedger row, atomically as far as the caller's transaction goes.
 * `qty` is signed: positive adds to the bucket, negative removes.
 */
export async function recordStockMovement(
  tx: Tx,
  params: {
    tenantId: string;
    productId: string;
    bucket: StockBucket;
    qty: DecimalInput;
    reason: StockMovementReason;
    refType: StockRefType;
    refId: string;
    date?: Date;
  }
): Promise<void> {
  const field = BUCKET_FIELD[params.bucket];

  await tx.product.update({
    where: { id: params.productId },
    data: { [field]: { increment: params.qty } },
  });

  await tx.stockLedger.create({
    data: {
      tenantId: params.tenantId,
      productId: params.productId,
      qty: params.qty,
      bucket: params.bucket,
      reason: params.reason,
      refType: params.refType,
      refId: params.refId,
      date: params.date ?? new Date(),
    },
  });
}

/**
 * Moves a quantity from one bucket to another on the SAME product — e.g.
 * RAW on-hand stock into WIP when a production run starts. Two signed
 * ledger rows (one per bucket), same reason/ref, so the ledger fully
 * explains where the quantity went.
 */
export async function transferStockBucket(
  tx: Tx,
  params: {
    tenantId: string;
    productId: string;
    fromBucket: StockBucket;
    toBucket: StockBucket;
    qty: DecimalInput;
    reason: StockMovementReason;
    refType: StockRefType;
    refId: string;
    date?: Date;
  }
): Promise<void> {
  const qty = new Decimal(params.qty);
  await recordStockMovement(tx, {
    ...params,
    bucket: params.fromBucket,
    qty: qty.negated(),
  });
  await recordStockMovement(tx, {
    ...params,
    bucket: params.toBucket,
    qty,
  });
}

/**
 * Pre-flight check for a batch of proposed deductions (e.g. every input
 * line on a production run) against one bucket each. Returns the full list
 * of shortages instead of throwing on the first one, so the caller can
 * show the user everything that's short in one pass — call this BEFORE
 * issuing any movements so a run either starts cleanly or not at all.
 */
export async function checkSufficientStock(
  tx: Tx,
  lines: { productId: string; bucket: StockBucket; qty: DecimalInput }[]
): Promise<InsufficientStockError | null> {
  const shortages: ConstructorParameters<typeof InsufficientStockError>[0] = [];

  for (const line of lines) {
    const field = BUCKET_FIELD[line.bucket];
    const product = await tx.product.findUnique({
      where: { id: line.productId },
      select: { name: true, [field]: true },
    });
    if (!product) continue; // caught by the FK constraint / caller's own validation

    const available = new Decimal(product[field] as DecimalInput);
    const required = new Decimal(line.qty);
    if (available.lessThan(required)) {
      shortages.push({
        productId: line.productId,
        productName: product.name as string,
        bucket: line.bucket,
        available,
        required,
        shortBy: required.minus(available),
      });
    }
  }

  return shortages.length > 0 ? new InsufficientStockError(shortages) : null;
}
