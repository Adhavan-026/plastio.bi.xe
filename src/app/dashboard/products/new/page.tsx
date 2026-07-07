import { createProduct } from "@/app/actions/products";
import { ProductForm } from "../product-form";

export default function NewProductPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Add product</h1>
      <ProductForm action={createProduct} submitLabel="Create product" />
    </div>
  );
}
