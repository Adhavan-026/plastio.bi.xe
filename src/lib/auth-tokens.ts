import "server-only";
import crypto from "node:crypto";

export const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // 1 hour
export const EMAIL_VERIFY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// URL-safe, high-entropy — used directly in email links (?token=...).
export function generateAuthToken(): string {
  return crypto.randomBytes(32).toString("hex");
}
