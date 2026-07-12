export type AgingBucket = {
  key: "current" | "1-15" | "16-30" | "31-45" | "45+";
  label: string;
  amount: number;
};

// Buckets outstanding balance (totalAmount - amountPaid) on unpaid/partial
// sales invoices by how many days past due they are. Falls back to
// invoiceDate when no explicit dueDate is set.
export function buildReceivablesAging(
  invoices: { totalAmount: unknown; amountPaid: unknown; invoiceDate: Date; dueDate: Date | null }[]
): AgingBucket[] {
  const buckets = { current: 0, "1-15": 0, "16-30": 0, "31-45": 0, "45+": 0 };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const invoice of invoices) {
    const balance = Number(invoice.totalAmount) - Number(invoice.amountPaid);
    if (balance <= 0) continue;

    const ref = new Date(invoice.dueDate ?? invoice.invoiceDate);
    ref.setHours(0, 0, 0, 0);
    const daysPastDue = Math.floor((today.getTime() - ref.getTime()) / 86_400_000);

    if (daysPastDue <= 0) buckets.current += balance;
    else if (daysPastDue <= 15) buckets["1-15"] += balance;
    else if (daysPastDue <= 30) buckets["16-30"] += balance;
    else if (daysPastDue <= 45) buckets["31-45"] += balance;
    else buckets["45+"] += balance;
  }

  return [
    { key: "current", label: "Current", amount: buckets.current },
    { key: "1-15", label: "1-15 Days", amount: buckets["1-15"] },
    { key: "16-30", label: "16-30 Days", amount: buckets["16-30"] },
    { key: "31-45", label: "31-45 Days", amount: buckets["31-45"] },
    { key: "45+", label: "Above 45 Days", amount: buckets["45+"] },
  ];
}
