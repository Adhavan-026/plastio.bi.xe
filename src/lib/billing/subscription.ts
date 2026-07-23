import "server-only";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant-db";
import type { SubscriptionPlan } from "@/lib/enums";

export const PLAN_DURATION_DAYS: Record<SubscriptionPlan, number> = {
  DAILY: 1,
  MONTHLY: 30,
  YEARLY: 365,
};

export const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  DAILY: "Daily",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
};

// The single source of truth for "is this shop currently allowed to use
// billing features" — no separate status enum to keep in sync, just compare
// the stored expiry against now.
export function isSubscriptionActive(tenant: { subscriptionExpiresAt: Date | null }): boolean {
  return !!tenant.subscriptionExpiresAt && tenant.subscriptionExpiresAt.getTime() > Date.now();
}

// Shared by the cloud activation form (src/app/actions/subscription.ts,
// which already knows which tenant it's redeeming for via the session) and
// the public desktop-activation API route (src/app/api/license/activate,
// which has no session and must find the tenant by licenseKey first). Both
// end up running the exact same match-and-extend logic once they have a
// tenant row in hand.
export async function redeemKeysForTenant(
  tenant: {
    id: string;
    licenseKey: string | null;
    activationCode: string | null;
    subscriptionPlan: SubscriptionPlan | null;
  },
  licenseKey: string,
  activationCode: string
): Promise<{ ok: true; expiresAt: Date } | { ok: false; error: string }> {
  if (!tenant.licenseKey || !tenant.activationCode || !tenant.subscriptionPlan) {
    return {
      ok: false,
      error: "No subscription has been issued for your shop yet. Contact us to get keys.",
    };
  }
  if (licenseKey !== tenant.licenseKey || activationCode !== tenant.activationCode) {
    return {
      ok: false,
      error: "Those keys don't match. Double-check them or contact us for the correct keys.",
    };
  }

  const durationDays = PLAN_DURATION_DAYS[tenant.subscriptionPlan];
  const expiresAt = new Date(Date.now() + durationDays * 86_400_000);
  const redeemedAt = new Date();

  await prisma.$transaction([
    prisma.tenant.update({
      where: { id: tenant.id },
      data: { subscriptionExpiresAt: expiresAt, keysRedeemedAt: redeemedAt },
    }),
    prisma.subscriptionIssue.updateMany({
      where: {
        tenantId: tenant.id,
        licenseKey: tenant.licenseKey,
        activationCode: tenant.activationCode,
        redeemedAt: null,
      },
      data: { redeemedAt },
    }),
  ]);

  return { ok: true, expiresAt };
}

/**
 * Call at the top of any feature page (invoices, purchases, products, ...)
 * that should be locked behind an active subscription. Redirects to the
 * key-activation page otherwise. Dashboard overview, Settings, and the
 * activation page itself never call this — they must stay reachable so an
 * expired shop can still see its status and enter new keys.
 */
export async function requireActiveSubscription(): Promise<void> {
  // Desktop mode's tenant is scoped to a purely local SQLite read here —
  // subscriptionExpiresAt was populated once, locally, at activation time
  // (see redeemDesktopLicense in src/app/actions/subscription.ts), so this
  // check needs no internet access. It's what actually "stops the service"
  // once a desktop subscription lapses.
  const { tenantId } = await getTenantContext();
  const tenant = await prisma.tenant.findUniqueOrThrow({
    where: { id: tenantId },
    select: { subscriptionExpiresAt: true },
  });
  if (!isSubscriptionActive(tenant)) {
    redirect("/dashboard/activate");
  }
}
