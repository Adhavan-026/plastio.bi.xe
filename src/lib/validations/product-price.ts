import * as z from "zod";

export const ProductPriceSchema = z.object({
  purchasePrice: z.coerce.number().min(0, { error: "Buying price can't be negative." }),
  sellingPrice: z.coerce.number().min(0, { error: "Selling price can't be negative." }),
});

export type ProductPriceState =
  | {
      errors?: Partial<Record<keyof z.infer<typeof ProductPriceSchema>, string[]>>;
      message?: string;
      ok?: boolean;
    }
  | undefined;

export type ProductPriceLogEntry = {
  id: string;
  purchasePrice: string;
  sellingPrice: string;
  changedAt: string;
};
