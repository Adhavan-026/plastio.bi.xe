import { ReceiptText, PackageSearch, ChartNoAxesCombined, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { ResetPasswordForm } from "./reset-password-form";

const FEATURES = [
  { icon: ReceiptText, text: "GST-compliant invoices in seconds" },
  { icon: PackageSearch, text: "Real-time stock & low-stock alerts" },
  { icon: ChartNoAxesCombined, text: "Built-in reports: sales, GST, P&L" },
  { icon: ShieldCheck, text: "Agro batch tracking & tyre warranty tools" },
];

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div className="flex min-h-svh">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-linear-to-br from-[#0B3B2E] via-[#0F5D3E] to-[#10B77F] p-10 text-white lg:flex">
        <div className="absolute top-1/4 -left-24 size-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -right-16 bottom-0 size-80 rounded-full bg-white/10 blur-3xl" />

        <div className="relative w-fit rounded-lg bg-white px-3 py-2">
          <Logo className="h-6 w-auto" />
        </div>

        <div className="relative flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <h1 className="text-3xl leading-tight font-bold text-balance">
              Billing built for how Indian shops actually work.
            </h1>
            <p className="max-w-sm text-sm text-white/80">
              GST-ready invoices, inventory, and reports for agro and tyre retailers — all in one
              place.
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
          &copy; {new Date().getFullYear()} Plastio.xe. Built for Indian retail.
        </p>
      </div>

      <div className="flex w-full items-center justify-center p-6 lg:w-1/2">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Reset password</CardTitle>
            <CardDescription>Choose a new password for your account.</CardDescription>
          </CardHeader>
          <CardContent>
            {token ? (
              <ResetPasswordForm token={token} />
            ) : (
              <p className="text-sm text-destructive">
                This reset link is missing its token. Request a new one from the login page.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
