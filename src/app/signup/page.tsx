import { ReceiptText, PackageSearch, ChartNoAxesCombined, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { SignupForm } from "./signup-form";

const FEATURES = [
  { icon: ReceiptText, text: "GST-compliant invoices in seconds" },
  { icon: PackageSearch, text: "Real-time stock & low-stock alerts" },
  { icon: ChartNoAxesCombined, text: "Built-in reports: sales, GST, P&L" },
  { icon: ShieldCheck, text: "Agro batch tracking & tyre warranty tools" },
];

export default function SignupPage() {
  return (
    <div className="flex min-h-svh">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-linear-to-br from-[#0d1b33] via-[#1e3a76] to-[#4a7cba] p-10 text-white lg:flex">
        <div className="absolute top-1/4 -left-24 size-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -right-16 bottom-0 size-80 rounded-full bg-white/10 blur-3xl" />

        <div className="relative w-fit rounded-lg bg-white px-3 py-2">
          <Logo className="h-6 w-auto" />
        </div>

        <div className="relative flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <h1 className="text-3xl leading-tight font-bold text-balance">
              Set up your shop in a couple of minutes.
            </h1>
            <p className="max-w-sm text-sm text-white/80">
              A few quick questions about your business, and your billing, stock, and reports are
              ready to go — tuned for agro and tyre retailers.
            </p>
          </div>

          <ul className="flex flex-col gap-3">
            {FEATURES.map((feature) => (
              <li key={feature.text} className="flex items-center gap-3 text-sm">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/15">
                  <feature.icon className="size-3.5" />
                </span>
                {feature.text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/60">
          &copy; {new Date().getFullYear()} Click One. Built for Indian retail.
        </p>
      </div>

      <div className="flex w-full items-center justify-center p-6 lg:w-1/2">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Create your shop</CardTitle>
            <CardDescription>Tell us a bit about your business to get started.</CardDescription>
          </CardHeader>
          <CardContent>
            <SignupForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
