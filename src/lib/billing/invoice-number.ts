import "server-only";

// Indian financial year: April 1 -> March 31.
export function getFinancialYearKey(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed, April = 3
  const startYear = month >= 3 ? year : year - 1;
  const endYearShort = (startYear + 1) % 100;
  return `${startYear}-${endYearShort.toString().padStart(2, "0")}`;
}

export const INVOICE_SEQ_MAX = 999999;

export function formatInvoiceNumber(type: string, fy: string, seq: number): string {
  return `${type}/${fy}/${seq.toString().padStart(4, "0")}`;
}

/**
 * Splits an app-generated invoice number ("SALES/2025-26/0042") into its
 * display prefix, the counter key it was allocated from, and the numeric
 * sequence. Returns null for numbers not in that shape (never generated
 * by this app), which therefore can't be renumbered.
 */
export function splitInvoiceNumber(
  invoiceNumber: string
): { prefix: string; counterKey: string; seq: number } | null {
  const m = /^([A-Z]+)\/(\d{4}-\d{2})\/(\d+)$/.exec(invoiceNumber);
  if (!m) return null;
  return { prefix: `${m[1]}/${m[2]}/`, counterKey: `${m[1]}-${m[2]}`, seq: Number(m[3]) };
}

// Duck-typed on purpose: both the raw PrismaClient and tenant-scoped
// $extends(...) client (and their transaction clients) satisfy this shape,
// but aren't structurally assignable to each other's generated types.
type Tx = {
  counter: {
    upsert: (args: {
      where: { tenantId_key: { tenantId: string; key: string } };
      create: { tenantId: string; key: string; value: number };
      update: { value?: { increment: number } };
    }) => Promise<{ value: number }>;
    updateMany: (args: {
      where: { tenantId: string; key: string; value: { lt: number } };
      data: { value: number };
    }) => Promise<unknown>;
  };
};

/**
 * Moves a counter forward to `value` so future bills continue after a
 * custom number. Never moves it backwards — that would re-issue sequence
 * numbers already used by existing invoices.
 */
export async function reseedCounter(
  tx: Tx,
  tenantId: string,
  key: string,
  value: number
): Promise<void> {
  await tx.counter.upsert({
    where: { tenantId_key: { tenantId, key } },
    create: { tenantId, key, value },
    update: {},
  });
  await tx.counter.updateMany({
    where: { tenantId, key, value: { lt: value } },
    data: { value },
  });
}

/**
 * Atomically allocates the next sequential invoice number for a tenant,
 * scoped by invoice type and financial year (e.g. "SALES/2025-26/0001").
 * Must be called inside the same transaction that creates the invoice so
 * a failed invoice create doesn't burn a number.
 *
 * `overrideSeq` (owner-gated custom bill number) uses that sequence instead
 * and re-seeds the counter so subsequent bills continue after it. The caller
 * is responsible for checking the resulting number isn't already taken.
 */
export async function getNextInvoiceNumber(
  tx: Tx,
  tenantId: string,
  type: string,
  date: Date,
  overrideSeq?: number
): Promise<string> {
  const fy = getFinancialYearKey(date);
  const key = `${type}-${fy}`;

  if (overrideSeq !== undefined) {
    await reseedCounter(tx, tenantId, key, overrideSeq);
    return formatInvoiceNumber(type, fy, overrideSeq);
  }

  const counter = await tx.counter.upsert({
    where: { tenantId_key: { tenantId, key } },
    create: { tenantId, key, value: 1 },
    update: { value: { increment: 1 } },
  });

  return formatInvoiceNumber(type, fy, counter.value);
}

/**
 * Read-only preview of the number the next invoice of this type will get,
 * for showing as a placeholder on the creation form. The real allocation
 * happens transactionally at save time, so this can drift if another bill
 * is created in between.
 */
export async function peekNextInvoiceNumber(
  db: {
    counter: {
      findUnique: (args: {
        where: { tenantId_key: { tenantId: string; key: string } };
      }) => Promise<{ value: number } | null>;
    };
  },
  tenantId: string,
  type: string,
  date: Date
): Promise<{ prefix: string; nextSeq: number }> {
  const fy = getFinancialYearKey(date);
  const counter = await db.counter.findUnique({
    where: { tenantId_key: { tenantId, key: `${type}-${fy}` } },
  });
  return { prefix: `${type}/${fy}/`, nextSeq: (counter?.value ?? 0) + 1 };
}
