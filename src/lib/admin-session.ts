import "server-only";
import crypto from "node:crypto";

// A separate, hand-rolled signed-cookie session for the Super Admin panel —
// deliberately NOT another NextAuth instance, since NextAuth's Session/User
// types are augmented globally (src/types/next-auth.d.ts) for the
// tenant-scoped shape (tenantId + role required on every user). A second
// instance would either have to fake those fields for admins or loosen the
// types for everyone; a small standalone signer avoids both.
export const ADMIN_COOKIE_NAME = "admin_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return secret;
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export function createAdminToken(adminId: string): string {
  const payload = JSON.stringify({ id: adminId, exp: Date.now() + SESSION_TTL_MS });
  const encoded = Buffer.from(payload).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

export function verifyAdminToken(token: string | undefined | null): { id: string } | null {
  if (!token) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expected = sign(encoded);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as {
      id?: unknown;
      exp?: unknown;
    };
    if (typeof payload.id !== "string" || typeof payload.exp !== "number") return null;
    if (payload.exp < Date.now()) return null;
    return { id: payload.id };
  } catch {
    return null;
  }
}
