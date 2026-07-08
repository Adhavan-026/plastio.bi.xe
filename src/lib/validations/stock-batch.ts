import * as z from "zod";

export const StockBatchFormSchema = z.object({
  productId: z.string().min(1, { error: "Select a product." }),
  batchNumber: z.string().min(1, { error: "Batch number is required." }).trim(),
  mfgDate: z.string().trim().optional().or(z.literal("")),
  expiryDate: z.string().trim().optional().or(z.literal("")),
  quantity: z.coerce
    .number({ error: "Quantity must be a number." })
    .positive({ error: "Quantity must be greater than 0." }),
  purchasePrice: z.coerce.number().min(0).default(0),
});

export type StockBatchFormState =
  | {
      errors?: Partial<Record<keyof z.infer<typeof StockBatchFormSchema>, string[]>>;
      message?: string;
    }
  | undefined;
