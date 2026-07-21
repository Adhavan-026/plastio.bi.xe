// Single source of truth for "which build is this" — read at runtime from
// an env var set at build time (see package.json's build:desktop script).
// Unset (or anything other than "desktop") always means cloud, so every
// existing dev/deploy flow that never sets this is completely unaffected.
//
// This file intentionally contains ONLY the flag — Step 1 (Prisma
// dual-target) needs it to pick a database adapter; Step 2 (auth/tenant
// bypass) is what actually branches application behavior on it.

export const DEPLOYMENT_MODE: "cloud" | "desktop" =
  process.env.DEPLOYMENT_MODE === "desktop" ? "desktop" : "cloud";

export const isDesktopMode = DEPLOYMENT_MODE === "desktop";
