import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/generated/prisma/enums";

// Prisma models that carry a tenantId column. Every model added to the
// schema that belongs to a shop (Product, Party, Invoice, ...) MUST be
// added here — this list is what makes getTenantDb() safe to trust.
const TENANT_SCOPED_MODELS = new Set([
  "User",
  "Product",
  "ProductCategory",
  "ProductPriceLog",
  "Party",
  "Invoice",
  "InvoiceItem",
  "Payment",
  "Counter",
  "StockAdjustment",
  "StockBatch",
  "Bom",
  "BomLine",
  "ProductionRun",
  "ProductionInput",
  "ProductionOutput",
  "JobWorkChallan",
  "JobWorkChallanLine",
  "StockLedger",
]);

export type TenantContext = {
  userId: string;
  tenantId: string;
  role: Role;
};

export async function requireSession() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // A session can outlive its tenant (account deleted, or a stale browser
  // session from before). Without this check, every downstream
  // `tenant.findUniqueOrThrow` call throws an unhandled 500 instead of
  // just bouncing back to login. Can't call signOut() here to also clear
  // the cookie — this runs during render, and cookie writes are only
  // allowed from a Server Action or Route Handler. The stale cookie gets
  // overwritten on the next successful login regardless.
  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: { id: true },
  });
  if (!tenant) redirect("/login");

  return session;
}

export async function getTenantContext(): Promise<TenantContext> {
  const session = await requireSession();
  return {
    userId: session.user.id,
    tenantId: session.user.tenantId,
    role: session.user.role,
  };
}

export function requireRole(context: TenantContext, allowed: Role[]) {
  if (!allowed.includes(context.role)) {
    throw new Error("Forbidden: insufficient role for this action");
  }
}

/**
 * Returns a Prisma client bound to the current tenant. Any operation on a
 * model listed in TENANT_SCOPED_MODELS automatically gets `tenantId`
 * merged into its `where` (reads/updates/deletes) or `data` (creates), so
 * call sites can never accidentally read or write another shop's rows.
 *
 * Limitations:
 * - Only the TOP-LEVEL operation's args are rewritten. Nested writes (e.g.
 *   `db.invoice.create({ data: { items: { create: [...] } } })`) are NOT
 *   walked, so nested rows must have `tenantId` set explicitly.
 * - `upsert` is NOT scoped (compound unique `where` shapes vary per model
 *   and can't be safely rewritten generically). Callers using `upsert`
 *   (e.g. the invoice counter) must pass `tenantId` explicitly themselves.
 */
export async function getTenantDb() {
  const { tenantId } = await getTenantContext();
  return scopeToTenant(tenantId);
}

function scopeToTenant(tenantId: string) {
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!model || !TENANT_SCOPED_MODELS.has(model)) {
            return query(args);
          }

          const scopedArgs = args as {
            where?: Record<string, unknown>;
            data?: Record<string, unknown> | Record<string, unknown>[];
          };

          switch (operation) {
            case "findMany":
            case "findFirst":
            case "findFirstOrThrow":
            case "findUnique":
            case "findUniqueOrThrow":
            case "count":
            case "aggregate":
            case "groupBy":
            case "update":
            case "updateMany":
            case "delete":
            case "deleteMany":
              scopedArgs.where = { ...scopedArgs.where, tenantId };
              break;
            case "create":
              scopedArgs.data = { ...(scopedArgs.data as Record<string, unknown>), tenantId };
              break;
            case "createMany":
              scopedArgs.data = Array.isArray(scopedArgs.data)
                ? scopedArgs.data.map((row) => ({ ...row, tenantId }))
                : scopedArgs.data;
              break;
            default:
              break;
          }

          return query(scopedArgs);
        },
      },
    },
  });
}
