import type { Role } from "@/generated/prisma/enums";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Whether an invoice can currently be edited: the owner must have enabled
 * the feature, the caller must be OWNER or MANAGER, and the invoice date
 * must be within the tenant's configured edit window.
 */
export function canEditInvoice(
  tenant: { allowInvoiceEdit: boolean; invoiceEditWindowDays: number },
  invoice: { invoiceDate: Date },
  role: Role
): boolean {
  if (!tenant.allowInvoiceEdit) return false;
  if (role !== "OWNER" && role !== "MANAGER") return false;
  const ageDays = (Date.now() - invoice.invoiceDate.getTime()) / MS_PER_DAY;
  return ageDays <= tenant.invoiceEditWindowDays;
}
