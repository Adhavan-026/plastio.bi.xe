import { getTenantContext } from "@/lib/tenant-db";
import { prisma } from "@/lib/prisma";
import { PLAN_LABELS } from "@/lib/billing/subscription";
import { DESKTOP_DOWNLOAD_URL } from "@/lib/desktop-download";
import { requestDesktopPlan } from "@/app/actions/desktop-app";
import { BackButton } from "@/components/dashboard/back-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, CheckCircle2 } from "lucide-react";
import type { SubscriptionPlan } from "@/lib/enums";

const PLANS: { key: SubscriptionPlan; blurb: string }[] = [
  { key: "DAILY", blurb: "Try it out, billed per day." },
  { key: "MONTHLY", blurb: "For regular use, billed monthly." },
  { key: "YEARLY", blurb: "Best value for full-time use." },
];

export default async function DesktopAppPage() {
  const { tenantId } = await getTenantContext();
  const tenant = await prisma.tenant.findUniqueOrThrow({
    where: { id: tenantId },
    select: { requestedPlan: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <BackButton />
      <div>
        <h1 className="text-2xl font-semibold">Get the offline desktop app</h1>
        <p className="text-muted-foreground text-sm">
          Run clickOne on your own computer — works fully offline, no internet connection needed
          day to day.
        </p>
      </div>

      {tenant.requestedPlan ? (
        <div className="bg-card flex max-w-lg flex-col gap-4 rounded-xl border p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="text-primary size-5 shrink-0" />
            <h2 className="text-sm font-bold">
              Thanks — you picked the {PLAN_LABELS[tenant.requestedPlan as SubscriptionPlan]} plan
            </h2>
          </div>
          <p className="text-muted-foreground text-sm">
            We&apos;ll be in touch soon to arrange payment. Once that&apos;s done, we&apos;ll send
            you a License Key and Activation Code — download the app now and enter those in the
            app&apos;s Settings page when you receive them.
          </p>
          <Button size="lg" render={<a href={DESKTOP_DOWNLOAD_URL} />} nativeButton={false} className="w-fit">
            <Download />
            Download for Windows
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-sm font-semibold">Choose a plan to get started</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {PLANS.map((plan) => (
              <form key={plan.key} action={requestDesktopPlan} className="contents">
                <input type="hidden" name="plan" value={plan.key} />
                <button
                  type="submit"
                  className="bg-card hover:border-primary flex flex-col items-start gap-2 rounded-xl border p-5 text-left shadow-sm transition-colors"
                >
                  <Badge variant="secondary">{PLAN_LABELS[plan.key]}</Badge>
                  <p className="text-muted-foreground text-sm">{plan.blurb}</p>
                </button>
              </form>
            ))}
          </div>
          <p className="text-muted-foreground text-sm">
            No payment happens here — picking a plan just lets us know what to contact you about.
          </p>
        </div>
      )}
    </div>
  );
}
