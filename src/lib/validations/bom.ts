import * as z from "zod";

export const BomLineInputSchema = z.object({
  inputProductId: z.string().min(1, { error: "Select an input item." }),
  qty: z.coerce.number({ error: "Quantity must be a number." }).positive({ error: "Quantity must be greater than 0." }),
  wastagePercent: z.coerce
    .number({ error: "Wastage % must be a number." })
    .min(0, { error: "Wastage % can't be negative." })
    .max(100, { error: "Wastage % can't exceed 100." })
    .default(0),
});

export const BomFormSchema = z.object({
  name: z.string().min(1, { error: "BOM name is required." }).trim(),
  outputProductId: z.string().min(1, { error: "Select the output item." }),
  outputQty: z.coerce
    .number({ error: "Output quantity must be a number." })
    .positive({ error: "Output quantity must be greater than 0." }),
  linesJson: z.string(),
});

export type BomFormState =
  | {
      errors?: Partial<Record<keyof z.infer<typeof BomFormSchema> | "lines", string[]>>;
      message?: string;
    }
  | undefined;
