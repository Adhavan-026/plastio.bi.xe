"use client";

import { useActionState, useState } from "react";
import { Copy, Check } from "lucide-react";
import { issueSubscription } from "@/app/actions/admin";
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

const PLAN_OPTIONS = [
  { value: "DAILY", label: "Daily" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "YEARLY", label: "Yearly" },
];

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <code className="bg-card flex-1 truncate rounded-lg border px-3 py-2 text-sm font-semibold tracking-wide">
          {value}
        </code>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={() => {
            navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
        >
          {copied ? <Check className="text-success" /> : <Copy />}
        </Button>
      </div>
    </div>
  );
}

export function IssueSubscriptionForm({ tenantId }: { tenantId: string }) {
  const [state, action, pending] = useActionState(issueSubscription.bind(null, tenantId), undefined);
  const [plan, setPlan] = useState("MONTHLY");

  return (
    <div className="flex flex-col gap-4">
      <form action={action} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="plan">Plan</Label>
            <input type="hidden" name="plan" value={plan} />
            <Select value={plan} onValueChange={(v) => setPlan(v as string)} items={{ DAILY: "Daily", MONTHLY: "Monthly", YEARLY: "Yearly" }}>
              <SelectTrigger id="plan" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLAN_OPTIONS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="amountPaid">Amount paid (₹)</Label>
            <Input id="amountPaid" name="amountPaid" type="number" min="0" step="0.01" placeholder="Optional" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" name="notes" placeholder="e.g. Paid via UPI" />
          </div>
        </div>

        {state?.error && <p className="text-destructive text-sm">{state.error}</p>}

        <Button type="submit" disabled={pending} className="w-fit">
          {pending ? "Issuing..." : "Issue new keys"}
        </Button>
      </form>

      {state?.licenseKey && state?.activationCode && (
        <div className="bg-accent flex flex-col gap-3 rounded-xl border p-4">
          <p className="text-accent-foreground text-sm font-semibold">{state.message}</p>
          <CopyField label="License Key" value={state.licenseKey} />
          <CopyField label="Activation Code" value={state.activationCode} />
        </div>
      )}
    </div>
  );
}
