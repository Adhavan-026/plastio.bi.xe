"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { createStockBatch } from "@/app/actions/stock-batches";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function BatchForm({ productId }: { productId: string }) {
  const [state, formAction, pending] = useActionState(createStockBatch, undefined);

  useEffect(() => {
    if (state?.message) toast.success(state.message);
  }, [state?.message]);

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-4">
      <input type="hidden" name="productId" value={productId} />

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="batchNumber">Batch number</Label>
          <Input id="batchNumber" name="batchNumber" required />
          {state?.errors?.batchNumber && (
            <p className="text-sm text-destructive">{state.errors.batchNumber[0]}</p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="quantity">Quantity received</Label>
          <Input id="quantity" name="quantity" type="number" step="0.001" required />
          {state?.errors?.quantity && (
            <p className="text-sm text-destructive">{state.errors.quantity[0]}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="mfgDate">Manufacturing date</Label>
          <Input id="mfgDate" name="mfgDate" type="date" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="expiryDate">Expiry date</Label>
          <Input id="expiryDate" name="expiryDate" type="date" />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="purchasePrice">Purchase price (this batch)</Label>
        <Input id="purchasePrice" name="purchasePrice" type="number" step="0.01" defaultValue="0" />
      </div>

      {state?.message && <p className="text-sm text-muted-foreground">{state.message}</p>}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving..." : "Add batch"}
      </Button>
    </form>
  );
}
