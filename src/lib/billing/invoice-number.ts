import "server-only";

// Indian financial year: April 1 -> March 31.
export function getFinancialYearKey(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed, April = 3
  const startYear = month >= 3 ? year : year - 1;
  const endYearShort = (startYear + 1) % 100;
  return `${startYear}-${endYearShort.toString().padStart(2, "0")}`;
}

// Duck-typed on purpose: both the raw PrismaClient and tenant-scoped
// $extends(...) client (and their transaction clients) satisfy this shape,
// but aren't structurally assignable to each other's generated types.
type Tx = {
  counter: {
    upsert: (args: {
      where: { tenantId_key: { tenantId: string; key: string } };
      create: { tenantId: string; key: string; value: number };
      update: { value: { increment: number } };
    }) => Promise<{ value: number }>;
  };
};

/**
 * Atomically allocates the next sequential invoice number for a tenant,
 * scoped by invoice type and financial year (e.g. "SALES/2025-26/0001").
 * Must be called inside the same transaction that creates the invoice so
 * a failed invoice create doesn't burn a number.
 */
export async function getNextInvoiceNumber(
  tx: Tx,
  tenantId: string,
  type: string,
  date: Date
): Promise<string> {
  const fy = getFinancialYearKey(date);
  const key = `${type}-${fy}`;

  const counter = await tx.counter.upsert({
    where: { tenantId_key: { tenantId, key } },
    create: { tenantId, key, value: 1 },
    update: { value: { increment: 1 } },
  });

  return `${type}/${fy}/${counter.value.toString().padStart(4, "0")}`;
}
