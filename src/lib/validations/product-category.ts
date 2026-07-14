import * as z from "zod";

export const ProductCategorySchema = z.object({
  name: z.string().min(1, { error: "Category name is required." }).trim(),
});
