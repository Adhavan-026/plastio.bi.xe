// Net balance for a party, from the shop's point of view:
// positive = party owes the shop, negative = shop owes the party.
// SALES and PURCHASE_RETURN increase what's owed to the shop;
// PURCHASE and SALES_RETURN decrease it. QUOTATION invoices don't count.
type InvoiceForBalance = {
  partyId: string;
  type: string;
  totalAmount: unknown;
  amountPaid: unknown;
};

export function computeBalancesByParty(invoices: InvoiceForBalance[]): Map<string, number> {
  const balances = new Map<string, number>();

  for (const invoice of invoices) {
    const due = Number(invoice.totalAmount) - Number(invoice.amountPaid);
    const sign = invoice.type === "SALES" || invoice.type === "PURCHASE_RETURN" ? 1 : -1;
    const current = balances.get(invoice.partyId) ?? 0;
    balances.set(invoice.partyId, current + sign * due);
  }

  return balances;
}
