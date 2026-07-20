import * as z from "zod";

export const JobWorkChallanLineSchema = z.object({
  productId: z.string().min(1, { error: "Select an item." }),
  qty: z.coerce.number({ error: "Quantity must be a number." }).positive({ error: "Quantity must be greater than 0." }),
  description: z.string().trim().optional().or(z.literal("")),
});

export const OutwardChallanFormSchema = z.object({
  partyId: z.string().min(1, { error: "Select a job worker." }),
  date: z.string().min(1, { error: "Date is required." }),
  expectedReturnDate: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().optional().or(z.literal("")),
  linesJson: z.string(),
});

export type OutwardChallanFormState =
  | {
      errors?: Partial<Record<keyof z.infer<typeof OutwardChallanFormSchema> | "lines", string[]>>;
      message?: string;
    }
  | undefined;

export const InwardReturnFormSchema = z.object({
  linkedChallanId: z.string().min(1, { error: "Select the outward challan being returned against." }),
  date: z.string().min(1, { error: "Date is required." }),
  notes: z.string().trim().optional().or(z.literal("")),
  linesJson: z.string(),
});

export type InwardReturnFormState =
  | {
      errors?: Partial<Record<keyof z.infer<typeof InwardReturnFormSchema> | "lines", string[]>>;
      message?: string;
    }
  | undefined;
