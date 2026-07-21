// App-owned literal union types mirroring fields that are real Prisma
// `enum`s in the cloud schema but plain `String` in the desktop schema
// (SQLite's connector doesn't support enums — see
// prisma/schema.desktop.prisma). Importing these instead of
// `@/generated/prisma/enums` means application code type-checks identically
// against either generated client, since these never depend on which
// schema was last generated.
//
// Only the enums actually referenced as *types* elsewhere in the app are
// listed here — see each field's schema comment for the full set (e.g.
// Unit, InvoiceType, PaymentMode, AdjustmentReason) if more are needed.

export type Role = "OWNER" | "MANAGER" | "CASHIER" | "ACCOUNTANT";
export type PartyType = "CUSTOMER" | "SUPPLIER" | "BOTH";
export type SubscriptionPlan = "DAILY" | "MONTHLY" | "YEARLY";
