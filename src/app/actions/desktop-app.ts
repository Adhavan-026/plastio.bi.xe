"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant-db";
import type { SubscriptionPlan } from "@/lib/enums";

const VALID_PLANS = new Set(["DAILY", "MONTHLY", "YEARLY"]);

// Records interest only — no payment happens here. The Super Admin sees
// this on the client list/detail page and follows up manually to arrange
// payment and issue a License Key + Activation Code.
export async function requestDesktopPlan(formData: FormData) {
  const { tenantId } = await getTenantContext();

  const plan = formData.get("plan");
  if (typeof plan !== "string" || !VALID_PLANS.has(plan)) {
    throw new Error("Invalid plan.");
  }

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { requestedPlan: plan as SubscriptionPlan },
  });

  revalidatePath("/dashboard/desktop-app");
}
