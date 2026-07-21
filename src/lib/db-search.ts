import { isDesktopMode } from "@/lib/deployment-mode";

/**
 * Case-insensitive "contains" filter, portable across the Postgres (cloud)
 * and SQLite (desktop) Prisma clients. Postgres needs `mode: "insensitive"`
 * explicitly; SQLite's connector doesn't support that option at all (it's a
 * type error on the desktop-generated client) — but SQLite's `contains`
 * already compiles to a `LIKE` clause, which SQLite case-folds by default
 * for ASCII text, so omitting `mode` there still searches case-insensitively
 * for the English/GST-number/HSN-code text this app searches on.
 */
export function ciContains(value: string) {
  return isDesktopMode ? { contains: value } : { contains: value, mode: "insensitive" as const };
}
