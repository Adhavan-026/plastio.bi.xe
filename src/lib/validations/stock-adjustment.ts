import * as z from "zod";

export const ADJUSTMENT_REASONS = ["DAMAGE", "LOSS", "CORRECTION", "OPENING_STOCK", "OTHER"] as const;

export const StockAdjustmentFormSchema = z.object({
  productId: z.string().min(1, { error: "Select a product." }),
  quantityChange: z.coerce
    .number({ error: "Quantity change must be a number." })
    .refine((v) => v !== 0, { error: "Quantity change can't be zero." }),
  reason: z.enum(ADJUSTMENT_REASONS),
  notes: z.string().trim().optional().or(z.literal("")),
});

export type StockAdjustmentFormState =
  | {
      errors?: Partial<Record<keyof z.infer<typeof StockAdjustmentFormSchema>, string[]>>;
      message?: string;
    }
  | undefined;
