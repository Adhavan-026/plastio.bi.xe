import * as z from "zod";

export const UNITS = ["PCS", "KG", "LITRE", "BAG", "BOX", "METER", "DOZEN", "OTHER"] as const;

// Tyre module: "category" is repurposed as the vehicle this product fits,
// shown as a dropdown instead of free text on Tyre-tenant product/invoice forms.
export const VEHICLE_TYPES = [
  "Car",
  "Bike/Scooter",
  "Auto Rickshaw",
  "Truck",
  "Bus",
  "Tractor",
  "Other",
] as const;

export const ProductFormSchema = z.object({
  name: z.string().min(1, { error: "Product name is required." }).trim(),
  hsnCode: z.string().trim().optional().or(z.literal("")),
  unit: z.enum(UNITS),
  category: z.string().trim().optional().or(z.literal("")),
  categoryId: z.string().trim().optional().or(z.literal("")),
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

// Row-level schema for the multi-product bulk-add screen — same fields as
// ProductFormSchema, just validated per-row from a JSON array instead of a
// single set of form fields.
export const ProductLineSchema = z.object({
  name: z.string().min(1, { error: "Product name is required." }).trim(),
  hsnCode: z.string().trim().optional().or(z.literal("")),
  unit: z.enum(UNITS),
  category: z.string().trim().optional().or(z.literal("")),
  categoryId: z.string().trim().optional().or(z.literal("")),
  gstRate: z.coerce
    .number({ error: "GST % must be a number." })
    .min(0, { error: "GST % can't be negative." })
    .max(100, { error: "GST % can't exceed 100." }),
  purchasePrice: z.coerce.number().min(0, { error: "Purchase price can't be negative." }),
  sellingPrice: z.coerce.number().min(0, { error: "Selling price can't be negative." }),
  stockQty: z.coerce.number().min(0, { error: "Stock quantity can't be negative." }),
  lowStockAlert: z.coerce.number().min(0, { error: "Low stock alert can't be negative." }),
  tyreBrand: z.string().trim().optional().or(z.literal("")),
  tyreSize: z.string().trim().optional().or(z.literal("")),
  tyrePattern: z.string().trim().optional().or(z.literal("")),
  tyreLoadIndex: z.string().trim().optional().or(z.literal("")),
});

export type ProductLine = z.infer<typeof ProductLineSchema>;

export type ProductBulkFormState =
  | {
      message?: string;
      successCount?: number;
    }
  | undefined;

/**
 * Minimal fields for creating a brand-new product inline from the billing
 * screen's item search, without leaving the invoice/purchase in progress.
 * Both prices are collected (not just the one relevant to this screen) so
 * the product is immediately usable from the other billing screen too.
 */
export const QuickProductSchema = z.object({
  name: z.string().min(1, { error: "Product name is required." }).trim(),
  unit: z.enum(UNITS),
  gstRate: z.coerce
    .number({ error: "GST % must be a number." })
    .min(0, { error: "GST % can't be negative." })
    .max(100, { error: "GST % can't exceed 100." }),
  purchasePrice: z.coerce.number().min(0, { error: "Purchase price can't be negative." }),
  sellingPrice: z.coerce.number().min(0, { error: "Selling price can't be negative." }),
  category: z.string().trim().optional().or(z.literal("")),
  categoryId: z.string().trim().optional().or(z.literal("")),
  tyreSize: z.string().trim().optional().or(z.literal("")),
  tyreBrand: z.string().trim().optional().or(z.literal("")),
});

export type QuickProductState =
  | {
      errors?: Partial<Record<keyof z.infer<typeof QuickProductSchema>, string[]>>;
      message?: string;
      product?: {
        id: string;
        name: string;
        unit: string;
        gstRate: string;
        sellingPrice: string;
        purchasePrice: string;
        stockQty: string;
        category: string | null;
        categoryId: string | null;
        tyreSize: string | null;
        tyreBrand: string | null;
      };
    }
  | undefined;
