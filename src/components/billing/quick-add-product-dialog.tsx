"use client";

import { useActionState, useEffect, useState } from "react";
import { PackagePlus } from "lucide-react";
import { quickCreateProduct } from "@/app/actions/products";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UNITS, VEHICLE_TYPES } from "@/lib/validations/product";

type QuickProduct = {
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
};

export function QuickAddProductDialog({
  showTyreFields,
  categories = [],
  existingSizes = [],
  existingBrands = [],
  onCreated,
}: {
  showTyreFields?: boolean;
  /** Shop-defined product categories (Tyre/Tube/Flap/...). */
  categories?: { id: string; name: string }[];
  /** Sizes/brands already used on other products, offered as suggestions. */
  existingSizes?: string[];
  existingBrands?: string[];
  onCreated: (product: QuickProduct) => void;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(quickCreateProduct, undefined);
  const [categoryId, setCategoryId] = useState("");
  const [vehicleType, setVehicleType] = useState("");

  useEffect(() => {
    if (state?.product) {
      onCreated(state.product);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(false);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCategoryId("");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVehicleType("");
    }
    // onCreated is a fresh closure from the parent every render; only re-run when the result changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.product]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" variant="outline" size="icon-sm" onClick={() => setOpen(true)} aria-label="Add new item">
        <PackagePlus />
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add new item</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <datalist id="quick-product-size-suggestions">
            {existingSizes.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
          <datalist id="quick-product-brand-suggestions">
            {existingBrands.map((b) => (
              <option key={b} value={b} />
            ))}
          </datalist>

          <div className="flex flex-col gap-2">
            <Label htmlFor="quick-product-name">Product name</Label>
            <Input id="quick-product-name" name="name" required autoFocus />
            {state?.errors?.name && (
              <p className="text-sm text-destructive">{state.errors.name[0]}</p>
            )}
          </div>

          {categories.length > 0 && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="quick-product-categoryId">Product category</Label>
              <input type="hidden" name="categoryId" value={categoryId} />
              <Select
                value={categoryId}
                onValueChange={(v) => setCategoryId(v as string)}
                items={Object.fromEntries(categories.map((c) => [c.id, c.name]))}
              >
                <SelectTrigger id="quick-product-categoryId" className="w-full">
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
            </div>
          )}

          {showTyreFields && (
            <>
              <div className="flex flex-col gap-2">
                <Label htmlFor="quick-product-category">Vehicle type / Fit for</Label>
                <input type="hidden" name="category" value={vehicleType} />
                <Select value={vehicleType} onValueChange={(v) => setVehicleType(v as string)}>
                  <SelectTrigger id="quick-product-category" className="w-full">
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
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="quick-product-size">Size</Label>
                  <Input
                    id="quick-product-size"
                    name="tyreSize"
                    list="quick-product-size-suggestions"
                    placeholder="e.g. 145/80 R12"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="quick-product-brand">Model / Brand</Label>
                  <Input
                    id="quick-product-brand"
                    name="tyreBrand"
                    list="quick-product-brand-suggestions"
                    placeholder="e.g. CEAT Milaze X3"
                  />
                </div>
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="quick-product-unit">Unit</Label>
              <Select name="unit" defaultValue="PCS">
                <SelectTrigger id="quick-product-unit" className="w-full">
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
            <div className="flex flex-col gap-2">
              <Label htmlFor="quick-product-gst">GST %</Label>
              <Input id="quick-product-gst" name="gstRate" type="number" step="0.01" defaultValue="0" />
              {state?.errors?.gstRate && (
                <p className="text-sm text-destructive">{state.errors.gstRate[0]}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="quick-product-purchase">Purchase price</Label>
              <Input
                id="quick-product-purchase"
                name="purchasePrice"
                type="number"
                step="0.01"
                defaultValue="0"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="quick-product-selling">Selling price</Label>
              <Input
                id="quick-product-selling"
                name="sellingPrice"
                type="number"
                step="0.01"
                defaultValue="0"
              />
            </div>
          </div>

          <p className="text-muted-foreground text-xs">
            Starts with 0 stock — a purchase that includes it will add stock the normal way once
            saved. Edit HSN code and other details later from Products.
          </p>

          <DialogFooter className="-mx-0 -mb-0 border-t-0 bg-transparent p-0 sm:justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? "Adding..." : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
