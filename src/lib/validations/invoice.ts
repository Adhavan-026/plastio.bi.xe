import * as z from "zod";
import { UNITS } from "@/lib/validations/product";

export const PAYMENT_MODES = ["CASH", "UPI", "CARD", "BANK_TRANSFER", "CHEQUE", "CREDIT"] as const;

export const InvoiceLineSchema = z.object({
  productId: z.string().optional().nullable(),
  description: z.string().min(1, { error: "Description is required." }),
  quantity: z.coerce.number({ error: "Quantity must be a number." }).positive({ error: "Quantity must be greater than 0." }),
  unit: z.enum(UNITS),
  rate: z.coerce.number({ error: "Rate must be a number." }).min(0, { error: "Rate can't be negative." }),
  discountPercent: z.coerce.number().min(0).max(100).default(0),
  gstRate: z.coerce.number().min(0).max(100),
  // Agro module
  batchId: z.string().optional().nullable(),
  // Tyre module
  tyreSerialNumber: z.string().trim().optional().nullable(),
  warrantyMonths: z.coerce.number().int().min(0).optional().nullable(),
});

export const SalesInvoiceFormSchema = z.object({
  partyId: z.string().min(1, { error: "Select a customer." }),
  invoiceDate: z.string().min(1, { error: "Invoice date is required." }),
  // Custom bill number (sequence part only, e.g. "42" -> SALES/2025-26/0042).
  // Blank means auto-number; honored server-side only when the owner has
  // enabled invoice editing.
  invoiceSequence: z
    .string()
    .trim()
    .regex(/^\d{0,6}$/, { error: "Bill number must be a whole number (up to 6 digits)." })
    .optional(),
  notes: z.string().trim().optional().or(z.literal("")),
  billDiscountPercent: z.coerce.number().min(0).max(100).default(0),
  amountPaid: z.coerce.number().min(0).default(0),
  paymentMode: z.enum(PAYMENT_MODES),
  itemsJson: z.string().min(1, { error: "Add at least one item." }),
  // Tyre module
  vehicleNumber: z.string().trim().optional().or(z.literal("")),
  vehicleType: z.string().trim().optional().or(z.literal("")),
  exchangeValue: z.coerce.number().min(0).default(0),
});

export type InvoiceLine = z.infer<typeof InvoiceLineSchema>;

// Editing an existing invoice: same fields as creation minus payment
// capture — recorded payments live in their own table and stay untouched.
export const InvoiceEditFormSchema = SalesInvoiceFormSchema.omit({
  amountPaid: true,
  paymentMode: true,
});

export type SalesInvoiceFormState =
  | {
      errors?: Partial<Record<keyof z.infer<typeof SalesInvoiceFormSchema>, string[]>>;
      message?: string;
    }
  | undefined;
