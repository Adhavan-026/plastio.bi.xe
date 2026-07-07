type LedgerInvoice = {
  invoiceNumber: string;
  invoiceDate: Date;
  type: string;
  totalAmount: unknown;
};

type LedgerPayment = {
  paymentDate: Date;
  amount: unknown;
  mode: string;
  invoice: { type: string } | null;
};

export type LedgerEntry = {
  date: Date;
  description: string;
  debit: number;
  credit: number;
  balance: number;
};

// Debit increases what the party owes the shop (a SALES bill, or a credit
// note against a purchase); credit decreases it (a payment received, or a
// sales return). Mirrors the sign convention in party-balance.ts.
export function buildPartyLedger(
  openingBalance: number,
  invoices: LedgerInvoice[],
  payments: LedgerPayment[]
): { entries: LedgerEntry[]; closingBalance: number } {
  const raw: Omit<LedgerEntry, "balance">[] = [];

  for (const inv of invoices) {
    const amount = Number(inv.totalAmount);
    const isDebit = inv.type === "SALES" || inv.type === "PURCHASE_RETURN";
    raw.push({
      date: inv.invoiceDate,
      description: inv.invoiceNumber,
      debit: isDebit ? amount : 0,
      credit: isDebit ? 0 : amount,
    });
  }

  for (const payment of payments) {
    const amount = Number(payment.amount);
    const invoiceType = payment.invoice?.type;
    const isAgainstReceivable = invoiceType === "SALES" || invoiceType === "PURCHASE_RETURN";
    raw.push({
      date: payment.paymentDate,
      description: `Payment (${payment.mode})`,
      debit: isAgainstReceivable ? 0 : amount,
      credit: isAgainstReceivable ? amount : 0,
    });
  }

  raw.sort((a, b) => a.date.getTime() - b.date.getTime());

  let balance = openingBalance;
  const entries = raw.map((row) => {
    balance += row.debit - row.credit;
    return { ...row, balance };
  });

  return { entries, closingBalance: balance };
}
