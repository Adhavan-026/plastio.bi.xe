import * as z from "zod";

export const UNITS = ["PCS", "KG", "LITRE", "BAG", "BOX", "METER", "DOZEN", "OTHER"] as const;

export const ProductFormSchema = z.object({
  name: z.string().min(1, { error: "Product name is required." }).trim(),
  hsnCode: z.string().trim().optional().or(z.literal("")),
  unit: z.enum(UNITS),
  category: z.string().trim().optional().or(z.literal("")),
  gstRate: z.coerce
    .number({ error: "GST % must be a number." })
    .min(0, { error: "GST % can't be negative." })
    .max(100, { error: "GST % can't exceed 100." }),
  purchasePrice: z.coerce.number().min(0, { error: "Purchase price can't be negative." }),
  sellingPrice: z.coerce.number().min(0, { error: "Selling price can't be negative." }),
  stockQty: z.coerce.number().min(0, { error: "Stock quantity can't be negative." }),
  lowStockAlert: z.coerce.number().min(0, { error: "Low stock alert can't be negative." }),
  // Tyre module
  tyreBrand: z.string().trim().optional().or(z.literal("")),
  tyreSize: z.string().trim().optional().or(z.literal("")),
  tyrePattern: z.string().trim().optional().or(z.literal("")),
  tyreLoadIndex: z.string().trim().optional().or(z.literal("")),
});

export type ProductFormState =
  | {
      errors?: Partial<Record<keyof z.infer<typeof ProductFormSchema>, string[]>>;
      message?: string;
    }
  | undefined;
