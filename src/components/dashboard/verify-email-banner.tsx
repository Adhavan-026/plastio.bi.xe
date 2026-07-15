"use client";

import { useState } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { resendVerificationEmail } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export function VerifyEmailBanner({ email }: { email: string }) {
  const [dismissed, setDismissed] = useState(false);
  const [pending, setPending] = useState(false);

  if (dismissed) return null;

  async function resend() {
    setPending(true);
    const result = await resendVerificationEmail();
    setPending(false);
    if (result.ok) toast.success(result.message);
  }

  return (
    <div className="border-warning/40 bg-warning/10 flex items-center justify-between gap-3 rounded-lg border px-4 py-2.5 text-sm print:hidden">
      <span>
        Please verify your email (<span className="font-medium">{email}</span>) to secure your
        account.
      </span>
      <div className="flex shrink-0 items-center gap-1">
        <Button type="button" variant="ghost" size="sm" onClick={resend} disabled={pending}>
          {pending ? "Sending..." : "Resend link"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Dismiss"
          onClick={() => setDismissed(true)}
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}
