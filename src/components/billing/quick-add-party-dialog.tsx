"use client";

import { useActionState, useEffect, useState } from "react";
import { UserPlus } from "lucide-react";
import { quickCreateParty } from "@/app/actions/parties";
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
import { INDIAN_STATES } from "@/lib/validations/states";

export function QuickAddPartyDialog({
  defaultType,
  tenantState,
  onCreated,
}: {
  defaultType: "CUSTOMER" | "SUPPLIER";
  /** Pre-selects the dialog's state field, since most quick-added parties are local. */
  tenantState: string | null;
  onCreated: (party: { id: string; name: string; state: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(quickCreateParty, undefined);

  useEffect(() => {
    if (state?.party) {
      onCreated(state.party);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(false);
    }
    // onCreated is a fresh closure from the parent every render; only re-run when the result changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.party]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" variant="outline" size="icon-sm" onClick={() => setOpen(true)} aria-label="Add new party">
        <UserPlus />
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add {defaultType === "CUSTOMER" ? "customer" : "supplier"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="type" value={defaultType} />
          <div className="flex flex-col gap-2">
            <Label htmlFor="quick-party-name">Name</Label>
            <Input id="quick-party-name" name="name" required autoFocus />
            {state?.errors?.name && (
              <p className="text-sm text-destructive">{state.errors.name[0]}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="quick-party-phone">Phone</Label>
            <Input id="quick-party-phone" name="phone" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="quick-party-state">State</Label>
            <Select name="state" defaultValue={tenantState ?? undefined}>
              <SelectTrigger id="quick-party-state" className="w-full">
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                {INDIAN_STATES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {state?.errors?.state && (
              <p className="text-sm text-destructive">{state.errors.state[0]}</p>
            )}
            <p className="text-muted-foreground text-xs">
              Drives CGST+SGST vs IGST on this invoice — defaults to your own state.
            </p>
          </div>
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
