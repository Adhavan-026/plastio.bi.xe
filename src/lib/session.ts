import "server-only";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { isDesktopMode } from "@/lib/deployment-mode";
import { getDesktopIdentity } from "@/lib/desktop-tenant";

// The one place that decides "who is the current user" — cloud mode defers
// to NextAuth's real session; desktop mode has no login, so it always
// resolves to the single auto-created shop owner instead, shaped exactly
// like a NextAuth Session so every existing `session.user.*` call site
// keeps working unchanged.
export async function getSession(): Promise<Session | null> {
  if (isDesktopMode) {
    const identity = await getDesktopIdentity();
    return {
      user: {
        id: identity.userId,
        tenantId: identity.tenantId,
        role: identity.role,
        name: identity.name,
        email: identity.email,
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
  }
  return auth();
}
