import "server-only";
import crypto from "node:crypto";

// Uppercase, no 0/O or 1/I — avoids characters that get misread when a
// shopkeeper is copying a key off a phone screen or a WhatsApp message.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomSegment(length: number): string {
  const bytes = crypto.randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

// PLX-XXXX-XXXX-XXXX-XXXX
export function generateLicenseKey(): string {
  return `PLX-${randomSegment(4)}-${randomSegment(4)}-${randomSegment(4)}-${randomSegment(4)}`;
}

// XXXXXX-XXXXXX-XXXXXX-XXXXXX — longer and differently grouped than the
// license key so the two are visually distinct, not just two random strings.
export function generateActivationCode(): string {
  return `${randomSegment(6)}-${randomSegment(6)}-${randomSegment(6)}-${randomSegment(6)}`;
}
