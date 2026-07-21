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

/**
 * Call at the top of any feature page (invoices, purchases, products, ...)
 * that should be locked behind an active subscription. Redirects to the
 * key-activation page otherwise. Dashboard overview, Settings, and the
 * activation page itself never call this — they must stay reachable so an
 * expired shop can still see its status and enter new keys.
 */
export async function requireActiveSubscription(): Promise<void> {
  const { tenantId } = await getTenantContext();
  const tenant = await prisma.tenant.findUniqueOrThrow({
    where: { id: tenantId },
    select: { subscriptionExpiresAt: true },
  });
  if (!isSubscriptionActive(tenant)) {
    redirect("/dashboard/activate");
  }
}
