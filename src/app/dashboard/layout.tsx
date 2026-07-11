import { auth } from "@/auth";
import { getTenantContext, getTenantDb } from "@/lib/tenant-db";
import { prisma } from "@/lib/prisma";
import { isLowStock } from "@/lib/billing/low-stock";
import { AppTopNav } from "@/components/dashboard/app-topnav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { tenantId } = await getTenantContext();
  const db = await getTenantDb();
  const [tenant, session, dueCount, products] = await Promise.all([
    prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } }),
    auth(),
    db.invoice.count({ where: { type: "SALES", paymentStatus: { in: ["UNPAID", "PARTIAL"] } } }),
    db.product.findMany({
      where: { isActive: true },
      select: { stockQty: true, lowStockAlert: true },
    }),
  ]);
  const userName = session?.user?.name ?? "User";
  const lowStockCount = products.filter((p) => isLowStock(p.stockQty, p.lowStockAlert)).length;

  return (
    <div className="flex min-h-full flex-col">
      <AppTopNav
        tenantName={tenant.name}
        businessType={tenant.businessType}
        userName={userName}
        dueCount={dueCount}
        lowStockCount={lowStockCount}
      />
      <div className="mx-auto w-full max-w-6xl min-w-0 flex-1 p-6 print:max-w-none print:p-0">
        {children}
      </div>
    </div>
  );
}
