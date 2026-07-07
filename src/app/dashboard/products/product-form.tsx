"use client";

import { useActionState } from "react";
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
import { UNITS } from "@/lib/validations/product";
import type { ProductFormState } from "@/lib/validations/product";

type ProductFormProps = {
  action: (state: ProductFormState, formData: FormData) => Promise<ProductFormState>;
  defaultValues?: {
    name: string;
    hsnCode: string | null;
    unit: string;
    category: string | null;
    gstRate: string;
    purchasePrice: string;
    sellingPrice: string;
    stockQty: string;
    lowStockAlert: string;
  };
  submitLabel: string;
};

export function ProductForm({ action, defaultValues, submitLabel }: ProductFormProps) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Product name</Label>
        <Input id="name" name="name" defaultValue={defaultValues?.name} required />
        {state?.errors?.name && <p className="text-sm text-destructive">{state.errors.name[0]}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
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

      <div className="flex flex-col gap-2">
        <Label htmlFor="category">Category</Label>
        <Input id="category" name="category" defaultValue={defaultValues?.category ?? ""} />
      </div>

      <div className="grid grid-cols-3 gap-4">
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

      <div className="grid grid-cols-2 gap-4">
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

      {state?.message && <p className="text-sm text-destructive">{state.message}</p>}

      <Button type="submit" disabled={pending} className="mt-2 self-start">
        {pending ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
