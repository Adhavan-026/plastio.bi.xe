"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { login } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);

  // Chrome's "Auto sign-in" can silently resubmit a saved email/password on
  // page load if there's exactly one saved credential for this origin. If
  // that account no longer exists (e.g. the shop's data was reset), this
  // just keeps retrying stale credentials instead of letting the user type
  // their current ones — tell the browser to always require a manual login.
  useEffect(() => {
    navigator.credentials?.preventSilentAccess?.().catch(() => {});
  }, []);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" placeholder="you@shop.com" required />
        {state?.errors?.email && (
          <p className="text-sm text-destructive">{state.errors.email[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link href="/forgot-password" className="text-xs underline underline-offset-4">
            Forgot password?
          </Link>
        </div>
        <Input id="password" name="password" type="password" required />
        {state?.errors?.password && (
          <p className="text-sm text-destructive">{state.errors.password[0]}</p>
        )}
      </div>

      {state?.message && <p className="text-sm text-destructive">{state.message}</p>}

      <Button type="submit" disabled={pending} className="mt-2">
        {pending ? "Logging in..." : "Log in"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have a shop yet?{" "}
        <Link href="/signup" className="underline underline-offset-4">
          Create one
        </Link>
      </p>
    </form>
  );
}
