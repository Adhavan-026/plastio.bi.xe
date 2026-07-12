export type InvoiceStatusLabel = "Paid" | "Overdue" | "Due";

export function getInvoiceStatusLabel(
  paymentStatus: "UNPAID" | "PARTIAL" | "PAID",
  invoiceDate: Date,
  dueDate: Date | null
): InvoiceStatusLabel {
  if (paymentStatus === "PAID") return "Paid";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const ref = new Date(dueDate ?? invoiceDate);
  ref.setHours(0, 0, 0, 0);

  return today.getTime() > ref.getTime() ? "Overdue" : "Due";
}
