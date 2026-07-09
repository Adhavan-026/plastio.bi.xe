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
};

export function QuickAddProductDialog({
  showTyreFields,
  onCreated,
}: {
  showTyreFields?: boolean;
  onCreated: (product: QuickProduct) => void;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(quickCreateProduct, undefined);

  useEffect(() => {
    if (state?.product) {
      onCreated(state.product);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(false);
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
          <div className="flex flex-col gap-2">
            <Label htmlFor="quick-product-name">Product name</Label>
            <Input id="quick-product-name" name="name" required autoFocus />
            {state?.errors?.name && (
              <p className="text-sm text-destructive">{state.errors.name[0]}</p>
            )}
          </div>

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

          <div className="flex flex-col gap-2">
            {showTyreFields ? (
              <>
                <Label htmlFor="quick-product-category">Vehicle type / Fit for</Label>
                <Select name="category">
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
              </>
            ) : (
              <>
                <Label htmlFor="quick-product-category">Category</Label>
                <Input id="quick-product-category" name="category" />
              </>
            )}
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
