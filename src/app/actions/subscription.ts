"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant-db";
import { redeemKeysForTenant } from "@/lib/billing/subscription";
import { isDesktopMode } from "@/lib/deployment-mode";
import { CLOUD_API_URL } from "@/lib/cloud-api";
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

  if (isDesktopMode) {
    return redeemDesktopLicense(tenantId, licenseKey, activationCode);
  }

  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } });

  const result = await redeemKeysForTenant(
    { ...tenant, subscriptionPlan: tenant.subscriptionPlan as SubscriptionPlan | null },
    licenseKey,
    activationCode
  );
  if (!result.ok) {
    return { error: result.error };
  }

  revalidatePath("/dashboard/activate");
  revalidatePath("/dashboard");

  return {
    message: `Activated! Your subscription is valid until ${result.expiresAt.toLocaleDateString("en-IN")}.`,
  };
}

// Desktop's local tenant never has a licenseKey/activationCode pre-issued
// to check against — there's no admin panel for the offline SQLite DB.
// Instead this makes the one explicit, user-triggered call out to the
// cloud server (POST /api/license/activate) to validate the key, then
// stores what comes back locally. Every ongoing check after this is a
// local DB read (see requireActiveSubscription) — no internet needed
// again until the subscription needs renewing.
async function redeemDesktopLicense(
  tenantId: string,
  licenseKey: string,
  activationCode: string
): Promise<RedeemSubscriptionState> {
  let response: Response;
  try {
    response = await fetch(`${CLOUD_API_URL}/api/license/activate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ licenseKey, activationCode }),
    });
  } catch {
    return {
      error: "Couldn't reach the activation server. Check your internet connection and try again.",
    };
  }

  const data = (await response.json().catch(() => null)) as
    | { ok: true; subscriptionPlan: string; subscriptionExpiresAt: string }
    | { ok: false; error: string }
    | null;

  if (!data || !data.ok) {
    return { error: data?.error ?? "Activation failed. Please try again." };
  }

  const expiresAt = new Date(data.subscriptionExpiresAt);

  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      licenseKey,
      activationCode,
      subscriptionPlan: data.subscriptionPlan as SubscriptionPlan,
      subscriptionExpiresAt: expiresAt,
      keysRedeemedAt: new Date(),
    },
  });

  revalidatePath("/dashboard/activate");
  revalidatePath("/dashboard");

  return {
    message: `Activated! Your subscription is valid until ${expiresAt.toLocaleDateString("en-IN")}.`,
  };
}
