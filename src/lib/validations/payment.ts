import * as z from "zod";
import { PAYMENT_MODES } from "@/lib/validations/invoice";

export const RecordPaymentFormSchema = z.object({
  invoiceId: z.string().min(1),
  amount: z.coerce.number({ error: "Amount must be a number." }).positive({ error: "Amount must be greater than 0." }),
  mode: z.enum(PAYMENT_MODES),
  reference: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().optional().or(z.literal("")),
});

export type RecordPaymentFormState =
  | {
      errors?: Partial<Record<keyof z.infer<typeof RecordPaymentFormSchema>, string[]>>;
      message?: string;
    }
  | undefined;
