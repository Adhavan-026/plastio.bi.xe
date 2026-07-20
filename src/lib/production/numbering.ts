import "server-only";

// Same atomic upsert-increment pattern as src/lib/billing/invoice-number.ts,
// reusing the existing Counter model — just calendar-year keyed instead of
// financial-year keyed, per the RUN-YYYY-NNNN / JWC-YYYY-NNNN formats.

type Tx = {
  counter: {
    upsert: (args: {
      where: { tenantId_key: { tenantId: string; key: string } };
      create: { tenantId: string; key: string; value: number };
      update: { value: { increment: number } };
    }) => Promise<{ value: number }>;
  };
};

function formatSeq(prefix: string, year: number, seq: number): string {
  return `${prefix}-${year}-${seq.toString().padStart(4, "0")}`;
}

async function getNextNumber(tx: Tx, tenantId: string, prefix: string, date: Date): Promise<string> {
  const year = date.getFullYear();
  const key = `${prefix}-${year}`;

  const counter = await tx.counter.upsert({
    where: { tenantId_key: { tenantId, key } },
    create: { tenantId, key, value: 1 },
    update: { value: { increment: 1 } },
  });

  return formatSeq(prefix, year, counter.value);
}

export function getNextRunNumber(tx: Tx, tenantId: string, date: Date = new Date()): Promise<string> {
  return getNextNumber(tx, tenantId, "RUN", date);
}

export function getNextChallanNumber(tx: Tx, tenantId: string, date: Date = new Date()): Promise<string> {
  return getNextNumber(tx, tenantId, "JWC", date);
}
