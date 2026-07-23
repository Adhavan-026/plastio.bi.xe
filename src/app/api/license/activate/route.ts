import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redeemKeysForTenant } from "@/lib/billing/subscription";
import type { SubscriptionPlan } from "@/lib/enums";

// Public, unauthenticated on purpose: this is what the offline desktop
// build calls — the one explicit, user-triggered network request it ever
// makes — when someone pastes in the License Key + Activation Code they
// were given after paying. There's no session to scope the lookup to (the
// desktop app has no cloud login), so the tenant is found by licenseKey
// (unique) instead, matching the same key+code pair check the cloud
// activation form already uses. Not weakening anything already exposed —
// the secret is the key/code pair itself, not the session that submits it.
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const raw = body as { licenseKey?: unknown; activationCode?: unknown };
  const licenseKey = typeof raw.licenseKey === "string" ? raw.licenseKey.trim().toUpperCase() : "";
  const activationCode =
    typeof raw.activationCode === "string" ? raw.activationCode.trim().toUpperCase() : "";

  if (!licenseKey || !activationCode) {
    return NextResponse.json(
      { ok: false, error: "Enter both the License Key and Activation Code." },
      { status: 400 }
    );
  }

  const tenant = await prisma.tenant.findUnique({ where: { licenseKey } });
  if (!tenant) {
    return NextResponse.json(
      { ok: false, error: "Those keys don't match. Double-check them or contact us for the correct keys." },
      { status: 404 }
    );
  }

  const result = await redeemKeysForTenant(
    { ...tenant, subscriptionPlan: tenant.subscriptionPlan as SubscriptionPlan | null },
    licenseKey,
    activationCode
  );
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    tenantName: tenant.name,
    subscriptionPlan: tenant.subscriptionPlan,
    subscriptionExpiresAt: result.expiresAt.toISOString(),
  });
}
