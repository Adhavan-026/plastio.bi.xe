"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { createStockAdjustment } from "@/app/actions/stock-adjustments";
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
import { ADJUSTMENT_REASONS } from "@/lib/validations/stock-adjustment";

export function AdjustStockForm({ productId }: { productId: string }) {
  const [state, formAction, pending] = useActionState(createStockAdjustment, undefined);

  useEffect(() => {
    if (state?.message) toast.success(state.message);
  }, [state?.message]);

  return (
    <form action={formAction} className="flex max-w-sm flex-col gap-4">
      <input type="hidden" name="productId" value={productId} />

      <div className="flex flex-col gap-2">
        <Label htmlFor="quantityChange">Quantity change</Label>
        <Input
          id="quantityChange"
          name="quantityChange"
          type="number"
          step="0.001"
          placeholder="e.g. 5 or -2"
          required
        />
        <p className="text-muted-foreground text-xs">Positive adds stock, negative removes it.</p>
        {state?.errors?.quantityChange && (
          <p className="text-sm text-destructive">{state.errors.quantityChange[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="reason">Reason</Label>
        <Select name="reason" defaultValue="CORRECTION">
          <SelectTrigger id="reason" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ADJUSTMENT_REASONS.map((reason) => (
              <SelectItem key={reason} value={reason}>
                {reason.replace("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="notes">Notes</Label>
        <Input id="notes" name="notes" placeholder="Optional" />
      </div>

      {state?.message && <p className="text-sm text-muted-foreground">{state.message}</p>}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving..." : "Apply adjustment"}
      </Button>
    </form>
  );
}
