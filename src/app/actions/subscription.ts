"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant-db";
import { PLAN_DURATION_DAYS } from "@/lib/billing/subscription";
import type { SubscriptionPlan } from "@/lib/enums";

export type RedeemSubscriptionState = { error?: string; message?: string } | undefined;

export async function redeemSubscription(
  _state: RedeemSubscriptionState,
  formData: FormData
): Promise<RedeemSubscriptionState> {
  const { tenantId } = await getTenantContext();

  const licenseKey = (formData.get("licenseKey") as string | null)?.trim().toUpperCase() ?? "";
  const activationCode = (formData.get("activationCode") as string | null)?.trim().toUpperCase() ?? "";
  if (!licenseKey || !activationCode) {
    return { error: "Enter both the License Key and Activation Code." };
  }

  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } });

  if (!tenant.licenseKey || !tenant.activationCode || !tenant.subscriptionPlan) {
    return { error: "No subscription has been issued for your shop yet. Contact us to get keys." };
  }

  if (licenseKey !== tenant.licenseKey || activationCode !== tenant.activationCode) {
    return { error: "Those keys don't match. Double-check them or contact us for the correct keys." };
  }

  const durationDays = PLAN_DURATION_DAYS[tenant.subscriptionPlan as SubscriptionPlan];
  const expiresAt = new Date(Date.now() + durationDays * 86_400_000);
  const redeemedAt = new Date();

  await prisma.$transaction([
    prisma.tenant.update({
      where: { id: tenantId },
      data: { subscriptionExpiresAt: expiresAt, keysRedeemedAt: redeemedAt },
    }),
    prisma.subscriptionIssue.updateMany({
      where: {
        tenantId,
        licenseKey: tenant.licenseKey,
        activationCode: tenant.activationCode,
        redeemedAt: null,
      },
      data: { redeemedAt },
    }),
  ]);

  revalidatePath("/dashboard/activate");
  revalidatePath("/dashboard");

  return {
    message: `Activated! Your subscription is valid until ${expiresAt.toLocaleDateString("en-IN")}.`,
  };
}
