import "server-only";
import { Prisma } from "@/generated/prisma/client";

const { Decimal } = Prisma;
type DecimalT = InstanceType<typeof Decimal>;

// Pure calculation helpers for Feature 4 (yield %) and Feature 5 (wastage
// threshold) — kept free of any DB/transaction dependency so they're easy
// to reason about and test in isolation from the transition orchestration
// in production-run-transitions.ts.

type QtyWithUnit = { qty: DecimalT; unit: string };

/**
 * (total FINISHED output / total input) x 100, using a common base unit.
 * Returns null when inputs and outputs don't share exactly one unit — the
 * comparison is meaningless across units (e.g. kg of paddy vs litres of oil).
 */
export function computeYieldPercent(
  inputs: QtyWithUnit[],
  finishedOutputs: QtyWithUnit[]
): DecimalT | null {
  const units = new Set([...inputs, ...finishedOutputs].map((x) => x.unit));
  if (units.size !== 1) return null;

  const totalInput = sumQty(inputs);
  if (totalInput.isZero()) return null;

  const totalFinished = sumQty(finishedOutputs);
  return totalFinished.div(totalInput).mul(100);
}

/**
 * Total output (finished + byproduct + wastage) must not exceed total
 * input, same base unit only. Returns an error message when it does, or
 * null when the check passes or can't be meaningfully made (mixed units).
 */
export function checkOutputNotOverInput(
  inputs: QtyWithUnit[],
  allOutputs: QtyWithUnit[]
): string | null {
  const units = new Set([...inputs, ...allOutputs].map((x) => x.unit));
  if (units.size !== 1) return null;

  const totalInput = sumQty(inputs);
  const totalOutput = sumQty(allOutputs);
  if (totalOutput.greaterThan(totalInput)) {
    return `Total output (${totalOutput.toString()}) exceeds total input (${totalInput.toString()}).`;
  }
  return null;
}

/**
 * Non-blocking warning: total output more than 2% below total input means
 * some quantity went unaccounted for (not logged as wastage either).
 * Same-unit-only, like the checks above.
 */
export function checkUnaccountedLoss(inputs: QtyWithUnit[], allOutputs: QtyWithUnit[]): string | null {
  const units = new Set([...inputs, ...allOutputs].map((x) => x.unit));
  if (units.size !== 1) return null;

  const totalInput = sumQty(inputs);
  if (totalInput.isZero()) return null;

  const totalOutput = sumQty(allOutputs);
  const shortfallPercent = totalInput.minus(totalOutput).div(totalInput).mul(100);
  if (shortfallPercent.greaterThan(2)) {
    return `Output is ${shortfallPercent.toFixed(1)}% below input — some quantity is unaccounted for (not output or logged as wastage).`;
  }
  return null;
}

/**
 * Total WASTAGE output vs. the tenant's configured threshold, same-unit
 * only (mixed units default to "not exceeded" — no meaningful comparison).
 */
export function checkWastageExceeded(
  inputs: QtyWithUnit[],
  wastageOutputs: QtyWithUnit[],
  maxWastagePercent: DecimalT
): boolean {
  const units = new Set([...inputs, ...wastageOutputs].map((x) => x.unit));
  if (units.size !== 1 || inputs.length === 0) return false;

  const totalInput = sumQty(inputs);
  if (totalInput.isZero()) return false;

  const totalWastage = sumQty(wastageOutputs);
  const wastagePercent = totalWastage.div(totalInput).mul(100);
  return wastagePercent.greaterThan(maxWastagePercent);
}

function sumQty(rows: QtyWithUnit[]): DecimalT {
  return rows.reduce((acc, r) => acc.plus(r.qty), new Decimal(0));
}
