"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";
import { generateLicenseKey, generateActivationCode } from "@/lib/billing/license";

const emptyToUndefined = (v: unknown) =>
  v === null || v === undefined || (typeof v === "string" && v.trim() === "") ? undefined : v;

const IssueSubscriptionSchema = z.object({
  plan: z.enum(["DAILY", "MONTHLY", "YEARLY"], { error: "Choose a plan." }),
  amountPaid: z.preprocess(emptyToUndefined, z.coerce.number().nonnegative().optional()),
  notes: z.preprocess(emptyToUndefined, z.string().trim().optional()),
});

export type IssueSubscriptionState =
  | {
      error?: string;
      message?: string;
      licenseKey?: string;
      activationCode?: string;
    }
  | undefined;

export async function issueSubscription(
  tenantId: string,
  _state: IssueSubscriptionState,
  formData: FormData
): Promise<IssueSubscriptionState> {
  const admin = await requireAdminSession();

  const validated = IssueSubscriptionSchema.safeParse({
    plan: formData.get("plan"),
    amountPaid: formData.get("amountPaid"),
    notes: formData.get("notes"),
  });
  if (!validated.success) {
    return { error: "Choose a plan before issuing keys." };
  }

  const { plan, amountPaid, notes } = validated.data;
  const licenseKey = generateLicenseKey();
  const activationCode = generateActivationCode();

  await prisma.$transaction([
    prisma.tenant.update({
      where: { id: tenantId },
      data: { licenseKey, activationCode, subscriptionPlan: plan },
    }),
    prisma.subscriptionIssue.create({
      data: {
        tenantId,
        plan,
        licenseKey,
        activationCode,
        amountPaid,
        notes,
        issuedByAdminId: admin.id,
      },
    }),
  ]);

  revalidatePath(`/admin/clients/${tenantId}`);

  return {
    message: "New keys issued — share them with the client so they can activate.",
    licenseKey,
    activationCode,
  };
}
