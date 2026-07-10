"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { updateTenantSettings } from "@/app/actions/settings";
import { LogoUpload } from "@/components/settings/logo-upload";
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
import { INDIAN_STATES } from "@/lib/validations/states";

type Props = {
  defaultValues: {
    name: string;
    gstNumber: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    state: string | null;
    licenseNumber: string | null;
    logoUrl: string | null;
    allowInvoiceEdit: boolean;
    invoiceEditWindowDays: number;
  };
  showLicenseNumber: boolean;
  isOwner: boolean;
};

export function SettingsForm({ defaultValues, showLicenseNumber, isOwner }: Props) {
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

      <LogoUpload defaultValue={defaultValues.logoUrl} />
      {state?.errors?.logoUrl && <p className="text-sm text-destructive">{state.errors.logoUrl[0]}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="gstNumber">GST number</Label>
          <Input id="gstNumber" name="gstNumber" defaultValue={defaultValues.gstNumber ?? ""} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="state">State</Label>
          <Select name="state" defaultValue={defaultValues.state ?? undefined}>
            <SelectTrigger id="state" className="w-full">
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
          {state?.errors?.state && <p className="text-sm text-destructive">{state.errors.state[0]}</p>}
          <p className="text-muted-foreground text-xs">
            Used to work out CGST+SGST vs IGST on invoices — must match each customer&apos;s state.
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

      {isOwner && (
        <div className="bg-card flex flex-col gap-4 rounded-xl border p-4 shadow-sm">
          <div>
            <h2 className="text-sm font-bold">Invoice editing</h2>
            <p className="text-muted-foreground text-xs">
              Owner-only setting. When enabled, owners and managers can edit an invoice&apos;s
              date and details for a limited number of days after the invoice date.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="allowInvoiceEdit">Allow invoice editing</Label>
              <Select
                name="allowInvoiceEdit"
                defaultValue={defaultValues.allowInvoiceEdit ? "true" : "false"}
                items={{ false: "Disabled", true: "Enabled" }}
              >
                <SelectTrigger id="allowInvoiceEdit" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">Disabled</SelectItem>
                  <SelectItem value="true">Enabled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="invoiceEditWindowDays">Editable within (days)</Label>
              <Input
                id="invoiceEditWindowDays"
                name="invoiceEditWindowDays"
                type="number"
                min="1"
                max="365"
                defaultValue={defaultValues.invoiceEditWindowDays}
              />
              {state?.errors?.invoiceEditWindowDays && (
                <p className="text-sm text-destructive">{state.errors.invoiceEditWindowDays[0]}</p>
              )}
            </div>
          </div>
        </div>
      )}

      <Button type="submit" disabled={pending} className="mt-2 self-start">
        {pending ? "Saving..." : "Save settings"}
      </Button>
    </form>
  );
}
