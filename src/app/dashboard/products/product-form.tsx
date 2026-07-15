"use client";

import { useActionState, useState } from "react";
import { AddCategoryDialog } from "@/components/products/add-category-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UNITS, VEHICLE_TYPES } from "@/lib/validations/product";
import type { ProductFormState } from "@/lib/validations/product";

type ProductFormProps = {
  action: (state: ProductFormState, formData: FormData) => Promise<ProductFormState>;
  categories: { id: string; name: string }[];
  /** Sizes/brands already used on other products, offered as suggestions
   * (not a strict list — free text is still allowed) so the same size
   * doesn't end up entered three different ways across the catalogue. */
  existingSizes?: string[];
  existingBrands?: string[];
  defaultValues?: {
    name: string;
    hsnCode: string | null;
    unit: string;
    category: string | null;
    categoryId: string | null;
    gstRate: string;
    purchasePrice: string;
    sellingPrice: string;
    stockQty: string;
    lowStockAlert: string;
    tyreBrand: string | null;
    tyreSize: string | null;
    tyrePattern: string | null;
    tyreLoadIndex: string | null;
  };
  submitLabel: string;
  showTyreFields?: boolean;
};

export function ProductForm({
  action,
  categories: initialCategories,
  existingSizes = [],
  existingBrands = [],
  defaultValues,
  submitLabel,
  showTyreFields,
}: ProductFormProps) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [categories, setCategories] = useState(initialCategories);
  const [categoryId, setCategoryId] = useState(defaultValues?.categoryId ?? "");

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-4">
      <datalist id="tyre-size-suggestions">
        {existingSizes.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
      <datalist id="tyre-brand-suggestions">
        {existingBrands.map((b) => (
          <option key={b} value={b} />
        ))}
      </datalist>

      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Product name</Label>
        <Input id="name" name="name" defaultValue={defaultValues?.name} required />
        {state?.errors?.name && <p className="text-sm text-destructive">{state.errors.name[0]}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="categoryId">Product category</Label>
        <input type="hidden" name="categoryId" value={categoryId} />
        <div className="flex items-center gap-2">
          <Select
            value={categoryId}
            onValueChange={(v) => setCategoryId(v as string)}
            items={Object.fromEntries(categories.map((c) => [c.id, c.name]))}
          >
            <SelectTrigger id="categoryId" className="w-full">
              <SelectValue placeholder="Other (uncategorized)" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <AddCategoryDialog
            onCreated={(c) => {
              setCategories((prev) => [...prev, c].sort((a, b) => a.name.localeCompare(b.name)));
              setCategoryId(c.id);
            }}
          />
        </div>
        <p className="text-muted-foreground text-xs">
          What kind of item this is (e.g. Tyre, Tube, Flap). Leave unset for &ldquo;Other&rdquo;.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {showTyreFields ? (
          <>
            <Label htmlFor="category">Vehicle type / Fit for</Label>
            <Select name="category" defaultValue={defaultValues?.category ?? undefined}>
              <SelectTrigger id="category" className="w-full">
                <SelectValue placeholder="Select vehicle type" />
              </SelectTrigger>
              <SelectContent>
                {VEHICLE_TYPES.map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        ) : (
          <>
            <Label htmlFor="category">Category</Label>
            <Input id="category" name="category" defaultValue={defaultValues?.category ?? ""} />
          </>
        )}
      </div>

      {showTyreFields && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="tyreSize">Size</Label>
            <Input
              id="tyreSize"
              name="tyreSize"
              list="tyre-size-suggestions"
              placeholder="e.g. 145/80 R12"
              defaultValue={defaultValues?.tyreSize ?? ""}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="tyreBrand">Model / Brand</Label>
            <Input
              id="tyreBrand"
              name="tyreBrand"
              list="tyre-brand-suggestions"
              placeholder="e.g. CEAT Milaze X3"
              defaultValue={defaultValues?.tyreBrand ?? ""}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="hsnCode">HSN code</Label>
          <Input id="hsnCode" name="hsnCode" defaultValue={defaultValues?.hsnCode ?? ""} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="unit">Unit</Label>
          <Select name="unit" defaultValue={defaultValues?.unit ?? "PCS"}>
            <SelectTrigger id="unit" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {UNITS.map((unit) => (
                <SelectItem key={unit} value={unit}>
                  {unit}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="gstRate">GST %</Label>
          <Input
            id="gstRate"
            name="gstRate"
            type="number"
            step="0.01"
            defaultValue={defaultValues?.gstRate ?? "0"}
            required
          />
          {state?.errors?.gstRate && (
            <p className="text-sm text-destructive">{state.errors.gstRate[0]}</p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="purchasePrice">Purchase price</Label>
          <Input
            id="purchasePrice"
            name="purchasePrice"
            type="number"
            step="0.01"
            defaultValue={defaultValues?.purchasePrice ?? "0"}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="sellingPrice">Selling price</Label>
          <Input
            id="sellingPrice"
            name="sellingPrice"
            type="number"
            step="0.01"
            defaultValue={defaultValues?.sellingPrice ?? "0"}
            required
          />
          {state?.errors?.sellingPrice && (
            <p className="text-sm text-destructive">{state.errors.sellingPrice[0]}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="stockQty">Current stock</Label>
          <Input
            id="stockQty"
            name="stockQty"
            type="number"
            step="0.001"
            defaultValue={defaultValues?.stockQty ?? "0"}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="lowStockAlert">Low stock alert at</Label>
          <Input
            id="lowStockAlert"
            name="lowStockAlert"
            type="number"
            step="0.001"
            defaultValue={defaultValues?.lowStockAlert ?? "0"}
            required
          />
        </div>
      </div>

      {showTyreFields && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="tyrePattern">Tread pattern</Label>
            <Input
              id="tyrePattern"
              name="tyrePattern"
              defaultValue={defaultValues?.tyrePattern ?? ""}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="tyreLoadIndex">Load index</Label>
            <Input
              id="tyreLoadIndex"
              name="tyreLoadIndex"
              defaultValue={defaultValues?.tyreLoadIndex ?? ""}
            />
          </div>
        </div>
      )}

      {state?.message && <p className="text-sm text-destructive">{state.message}</p>}

      <Button type="submit" disabled={pending} className="mt-2 self-start">
        {pending ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
