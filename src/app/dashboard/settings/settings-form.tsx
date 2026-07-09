"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { updateTenantSettings } from "@/app/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  defaultValues: {
    name: string;
    gstNumber: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    state: string | null;
    licenseNumber: string | null;
  };
  showLicenseNumber: boolean;
};

export function SettingsForm({ defaultValues, showLicenseNumber }: Props) {
  const [state, formAction, pending] = useActionState(updateTenantSettings, undefined);

  useEffect(() => {
    if (state?.message) toast.success(state.message);
  }, [state?.message]);

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Shop name</Label>
        <Input id="name" name="name" defaultValue={defaultValues.name} required />
        {state?.errors?.name && <p className="text-sm text-destructive">{state.errors.name[0]}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="gstNumber">GST number</Label>
          <Input id="gstNumber" name="gstNumber" defaultValue={defaultValues.gstNumber ?? ""} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            name="state"
            placeholder="e.g. Tamil Nadu"
            defaultValue={defaultValues.state ?? ""}
          />
          <p className="text-muted-foreground text-xs">
            Used to work out CGST+SGST vs IGST on invoices — must match how you enter customer
            state.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" defaultValue={defaultValues.phone ?? ""} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={defaultValues.email ?? ""} />
          {state?.errors?.email && (
            <p className="text-sm text-destructive">{state.errors.email[0]}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="address">Address</Label>
        <Input id="address" name="address" defaultValue={defaultValues.address ?? ""} />
      </div>

      {showLicenseNumber && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="licenseNumber">Dealer license number</Label>
          <Input
            id="licenseNumber"
            name="licenseNumber"
            defaultValue={defaultValues.licenseNumber ?? ""}
          />
          <p className="text-muted-foreground text-xs">Printed on every invoice.</p>
        </div>
      )}

      <Button type="submit" disabled={pending} className="mt-2 self-start">
        {pending ? "Saving..." : "Save settings"}
      </Button>
    </form>
  );
}
