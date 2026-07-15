"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { resetPassword } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPassword, undefined);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const mismatch = confirmPassword.length > 0 && password !== confirmPassword;

  if (state?.ok) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm">{state.message}</p>
        <Link href="/login" className="text-sm underline underline-offset-4">
          Go to log in
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {state?.errors?.password ? (
          <div className="text-sm text-destructive">
            <p>Password must:</p>
            <ul className="list-inside list-disc">
              {state.errors.password.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">At least 8 characters, with a letter and a number.</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="confirmPassword">Re-enter password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="Re-enter password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          aria-invalid={mismatch}
          required
        />
        {state?.errors?.confirmPassword ? (
          <p className="text-sm text-destructive">{state.errors.confirmPassword[0]}</p>
        ) : mismatch ? (
          <p className="text-sm text-destructive">Passwords don&apos;t match.</p>
        ) : null}
      </div>

      {state?.message && <p className="text-sm text-destructive">{state.message}</p>}

      <Button type="submit" disabled={pending || mismatch} className="mt-2">
        {pending ? "Resetting..." : "Reset password"}
      </Button>
    </form>
  );
}
