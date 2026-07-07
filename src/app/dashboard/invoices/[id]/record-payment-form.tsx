"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { recordPayment } from "@/app/actions/payments";
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
import { PAYMENT_MODES } from "@/lib/validations/invoice";

export function RecordPaymentForm({ invoiceId, balanceDue }: { invoiceId: string; balanceDue: number }) {
  const [state, formAction, pending] = useActionState(recordPayment, undefined);

  useEffect(() => {
    if (state?.message) toast.success(state.message);
  }, [state?.message]);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3 print:hidden">
      <input type="hidden" name="invoiceId" value={invoiceId} />

      <div className="flex flex-col gap-2">
        <Label htmlFor="amount">Amount (balance ₹{balanceDue.toFixed(2)})</Label>
        <Input id="amount" name="amount" type="number" step="0.01" className="w-36" required />
        {state?.errors?.amount && (
          <p className="text-sm text-destructive">{state.errors.amount[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="mode">Mode</Label>
        <Select name="mode" defaultValue="CASH">
          <SelectTrigger id="mode" className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAYMENT_MODES.map((mode) => (
              <SelectItem key={mode} value={mode}>
                {mode}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="reference">Reference</Label>
        <Input id="reference" name="reference" placeholder="Optional" className="w-40" />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Recording..." : "Record payment"}
      </Button>
    </form>
  );
}
