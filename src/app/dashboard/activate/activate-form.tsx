"use client";

import { useActionState } from "react";
import { redeemSubscription } from "@/app/actions/subscription";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ActivateForm() {
  const [state, action, pending] = useActionState(redeemSubscription, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="licenseKey">License Key</Label>
        <Input
          id="licenseKey"
          name="licenseKey"
          placeholder="PLX-XXXX-XXXX-XXXX-XXXX"
          className="font-mono"
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="activationCode">Activation Code</Label>
        <Input
          id="activationCode"
          name="activationCode"
          placeholder="XXXXXX-XXXXXX-XXXXXX-XXXXXX"
          className="font-mono"
          required
        />
      </div>

      {state?.error && <p className="text-destructive text-sm">{state.error}</p>}
      {state?.message && <p className="text-success text-sm font-medium">{state.message}</p>}

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Activating..." : "Activate"}
      </Button>
    </form>
  );
}
