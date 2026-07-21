import { getTenantContext, getTenantDb } from "@/lib/tenant-db";
import { prisma } from "@/lib/prisma";
import { isLowStock } from "@/lib/billing/low-stock";
import { AppSidebar, type BusinessType } from "@/components/dashboard/app-sidebar";
import { AppTopBar } from "@/components/dashboard/app-topbar";
import { SessionGuard } from "@/components/dashboard/session-guard";
import { VerifyEmailBanner } from "@/components/dashboard/verify-email-banner";
import { isDesktopMode } from "@/lib/deployment-mode";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { tenantId, userId } = await getTenantContext();
  const db = await getTenantDb();
  const [tenant, dueCount, products, currentUser] = await Promise.all([
    prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } }),
    db.invoice.count({ where: { type: "SALES", paymentStatus: { in: ["UNPAID", "PARTIAL"] } } }),
    db.product.findMany({
      where: { isActive: true },
      select: { stockQty: true, lowStockAlert: true },
    }),
    db.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, emailVerifiedAt: true },
    }),
  ]);
  const userName = currentUser?.name ?? "User";
  const lowStockCount = products.filter((p) => isLowStock(p.stockQty, p.lowStockAlert)).length;

  return (
    <div className="flex min-h-full">
      <SessionGuard desktopMode={isDesktopMode} />
      <AppSidebar
        tenantName={tenant.name}
        businessType={tenant.businessType as BusinessType}
        lowStockCount={lowStockCount}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopBar
          tenantName={tenant.name}
          businessType={tenant.businessType as BusinessType}
          userName={userName}
          dueCount={dueCount}
          lowStockCount={lowStockCount}
        />
        <div className="mx-auto flex w-full max-w-6xl min-w-0 flex-1 flex-col gap-4 p-6 print:max-w-none print:p-0">
          {currentUser && !currentUser.emailVerifiedAt && (
            <VerifyEmailBanner email={currentUser.email} />
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
