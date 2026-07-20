import * as z from "zod";

export const OUTPUT_TYPES = ["FINISHED", "BYPRODUCT", "WASTAGE"] as const;

export const ProductionInputLineSchema = z.object({
  productId: z.string().min(1, { error: "Select an item." }),
  qty: z.coerce.number({ error: "Quantity must be a number." }).positive({ error: "Quantity must be greater than 0." }),
});

export const ProductionOutputLineSchema = z.object({
  productId: z.string().min(1, { error: "Select an item." }),
  qty: z.coerce.number({ error: "Quantity must be a number." }).positive({ error: "Quantity must be greater than 0." }),
  outputType: z.enum(OUTPUT_TYPES),
});

export const ProductionRunFormSchema = z.object({
  bomId: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().optional().or(z.literal("")),
  inputsJson: z.string(),
});

export type ProductionRunFormState =
  | {
      errors?: Partial<Record<keyof z.infer<typeof ProductionRunFormSchema> | "inputs", string[]>>;
      message?: string;
    }
  | undefined;

export const CompleteProductionRunSchema = z.object({
  runId: z.string().min(1),
  outputsJson: z.string(),
});

export type CompleteProductionRunState =
  | {
      errors?: Record<string, string[]>;
      message?: string;
      warning?: string;
    }
  | undefined;
