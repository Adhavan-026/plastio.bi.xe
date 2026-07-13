"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Sprout, Disc3, Store, ArrowRight, Check } from "lucide-react";
import { signup } from "@/app/actions/auth";
import { cn } from "@/lib/utils";
import { INDIAN_STATES } from "@/lib/validations/states";
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

type BusinessType = "COMMON" | "AGRO" | "TYRE";

const BUSINESS_OPTIONS: {
  value: BusinessType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    value: "TYRE",
    label: "Tyre & Auto Shop",
    description: "Tyres, fitting, vehicle service",
    icon: Disc3,
  },
  {
    value: "AGRO",
    label: "Agro / Fertilizer Shop",
    description: "Seeds, pesticides, fertilizers",
    icon: Sprout,
  },
  {
    value: "COMMON",
    label: "General Retail",
    description: "Everything else",
    icon: Store,
  },
];

const WARRANTY_OPTIONS = ["3", "6", "12", "18", "24"];

const STEP_LABELS = ["Account", "Business", "Store details", "Details"];

export function SignupForm() {
  const [state, action, pending] = useActionState(signup, undefined);
  const [step, setStep] = useState(0);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessType, setBusinessType] = useState<BusinessType | "">("");
  const [shopName, setShopName] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [warrantyMonths, setWarrantyMonths] = useState("12");

  const hasDomainStep = businessType === "AGRO" || businessType === "TYRE";
  const totalSteps = hasDomainStep ? 4 : 3;
  const isLastStep = step === totalSteps - 1;

  const isEmailValid = /^\S+@\S+\.\S+$/.test(email);
  const stepValid =
    step === 0
      ? name.trim().length >= 2 && isEmailValid && password.length >= 8
      : step === 1
        ? businessType !== ""
        : step === 2
          ? shopName.trim().length >= 2 && selectedState !== ""
          : true;

  function next() {
    if (!stepValid) return;
    setStep((s) => Math.min(totalSteps - 1, s + 1));
  }
  function back() {
    setStep((s) => Math.max(0, s - 1));
  }

  return (
    <form action={action} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                i <= step ? "bg-primary" : "bg-secondary"
              )}
            />
          ))}
        </div>
        <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          Step {step + 1} of {totalSteps} &middot; {STEP_LABELS[step]}
        </p>
      </div>

      {/* Step 1: account basics */}
      <div className={cn("flex flex-col gap-4", step !== 0 && "hidden")}>
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Your name</Label>
          <Input
            id="name"
            name="name"
            placeholder="Owner's full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          {state?.errors?.name && <p className="text-destructive text-sm">{state.errors.name[0]}</p>}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@shop.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {state?.errors?.email && <p className="text-destructive text-sm">{state.errors.email[0]}</p>}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {state?.errors?.password ? (
            <div className="text-destructive text-sm">
              <p>Password must:</p>
              <ul className="list-inside list-disc">
                {state.errors.password.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-muted-foreground text-xs">At least 8 characters, with a letter and a number.</p>
          )}
        </div>
      </div>

      {/* Step 2: business type */}
      <div className={cn("flex flex-col gap-3", step !== 1 && "hidden")}>
        <input type="hidden" name="businessType" value={businessType} />
        {BUSINESS_OPTIONS.map((option) => {
          const selected = businessType === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setBusinessType(option.value)}
              className={cn(
                "flex items-center gap-3.5 rounded-xl border p-4 text-left transition-colors",
                selected ? "border-primary bg-accent" : "hover:border-primary/40 hover:bg-secondary/40"
              )}
            >
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-lg",
                  selected ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                )}
              >
                <option.icon className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">{option.label}</p>
                <p className="text-muted-foreground text-xs">{option.description}</p>
              </div>
              {selected && <Check className="text-primary size-5 shrink-0" />}
            </button>
          );
        })}
        {state?.errors?.businessType && (
          <p className="text-destructive text-sm">{state.errors.businessType[0]}</p>
        )}
      </div>

      {/* Step 3: store details */}
      <div className={cn("flex flex-col gap-4", step !== 2 && "hidden")}>
        <div className="flex flex-col gap-2">
          <Label htmlFor="shopName">Shop name</Label>
          <Input
            id="shopName"
            name="shopName"
            placeholder="Sri Krishna Agro Center"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            required
          />
          {state?.errors?.shopName && <p className="text-destructive text-sm">{state.errors.shopName[0]}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="state">State</Label>
          <input type="hidden" name="state" value={selectedState} />
          <Select value={selectedState} onValueChange={(v) => setSelectedState(v as string)}>
            <SelectTrigger id="state" className="w-full">
              <SelectValue placeholder="Select your shop's state" />
            </SelectTrigger>
            <SelectContent>
              {INDIAN_STATES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {state?.errors?.state && <p className="text-destructive text-sm">{state.errors.state[0]}</p>}
          <p className="text-muted-foreground text-xs">
            Used to work out CGST+SGST vs IGST correctly on your invoices.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="gstNumber">GST number</Label>
            <Input id="gstNumber" name="gstNumber" placeholder="Optional" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" placeholder="Optional" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="address">Address</Label>
          <Input id="address" name="address" placeholder="Optional" />
        </div>
        <p className="text-muted-foreground text-xs">
          GST number, phone, and address can be added later from Settings if you don&apos;t have them handy.
        </p>
      </div>

      {/* Step 4: domain-specific */}
      {hasDomainStep && (
        <div className={cn("flex flex-col gap-4", step !== 3 && "hidden")}>
          {businessType === "AGRO" && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="licenseNumber">Dealer license number</Label>
              <Input id="licenseNumber" name="licenseNumber" placeholder="Optional — add later if you don't have it" />
              <p className="text-muted-foreground text-xs">
                Your pesticide/fertilizer/seed dealer license. Printed on every invoice.
              </p>
            </div>
          )}
          {businessType === "TYRE" && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="defaultWarrantyMonths">Default tyre warranty</Label>
              <input type="hidden" name="defaultWarrantyMonths" value={warrantyMonths} />
              <Select value={warrantyMonths} onValueChange={(v) => setWarrantyMonths(v as string)}>
                <SelectTrigger id="defaultWarrantyMonths" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WARRANTY_OPTIONS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m} months
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-xs">
                Applied by default when you add a new tyre product — you can still change it per sale.
              </p>
            </div>
          )}
        </div>
      )}

      {state?.message && <p className="text-destructive text-sm">{state.message}</p>}

      <div className="flex items-center justify-between gap-3">
        {step > 0 ? (
          <Button type="button" variant="outline" onClick={back}>
            Back
          </Button>
        ) : (
          <span />
        )}
        {!isLastStep ? (
          <Button type="button" onClick={next} disabled={!stepValid}>
            Continue
            <ArrowRight />
          </Button>
        ) : (
          <Button type="submit" disabled={pending}>
            {pending ? "Creating account..." : "Create account"}
          </Button>
        )}
      </div>

      <p className="text-muted-foreground text-center text-sm">
        Already have an account?{" "}
        <Link href="/login" className="underline underline-offset-4">
          Log in
        </Link>
      </p>
    </form>
  );
}
