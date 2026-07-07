"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup } from "@/app/actions/auth";
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

export function SignupForm() {
  const [state, action, pending] = useActionState(signup, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="shopName">Shop name</Label>
        <Input id="shopName" name="shopName" placeholder="Sri Krishna Agro Center" required />
        {state?.errors?.shopName && (
          <p className="text-sm text-destructive">{state.errors.shopName[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="businessType">Business type</Label>
        <Select name="businessType" defaultValue="COMMON">
          <SelectTrigger id="businessType" className="w-full">
            <SelectValue placeholder="Select a business type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="COMMON">General / Common</SelectItem>
            <SelectItem value="AGRO">Agro (Fertilizer / Pesticide / Seed)</SelectItem>
            <SelectItem value="TYRE">Tyre & Auto Service</SelectItem>
          </SelectContent>
        </Select>
        {state?.errors?.businessType && (
          <p className="text-sm text-destructive">{state.errors.businessType[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Your name</Label>
        <Input id="name" name="name" placeholder="Owner's full name" required />
        {state?.errors?.name && (
          <p className="text-sm text-destructive">{state.errors.name[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" placeholder="you@shop.com" required />
        {state?.errors?.email && (
          <p className="text-sm text-destructive">{state.errors.email[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" required />
        {state?.errors?.password && (
          <div className="text-sm text-destructive">
            <p>Password must:</p>
            <ul className="list-inside list-disc">
              {state.errors.password.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {state?.message && <p className="text-sm text-destructive">{state.message}</p>}

      <Button type="submit" disabled={pending} className="mt-2">
        {pending ? "Creating shop..." : "Create shop"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="underline underline-offset-4">
          Log in
        </Link>
      </p>
    </form>
  );
}
