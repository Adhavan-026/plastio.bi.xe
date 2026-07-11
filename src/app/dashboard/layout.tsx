import { auth } from "@/auth";
import { getTenantContext, getTenantDb } from "@/lib/tenant-db";
import { prisma } from "@/lib/prisma";
import { AppTopNav } from "@/components/dashboard/app-topnav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { tenantId } = await getTenantContext();
  const db = await getTenantDb();
  const [tenant, session, dueCount] = await Promise.all([
    prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } }),
    auth(),
    db.invoice.count({ where: { type: "SALES", paymentStatus: { in: ["UNPAID", "PARTIAL"] } } }),
  ]);
  const userName = session?.user?.name ?? "User";

  return (
    <div className="flex min-h-full flex-col">
      <AppTopNav
        tenantName={tenant.name}
        businessType={tenant.businessType}
        userName={userName}
        dueCount={dueCount}
      />
      <div className="mx-auto w-full max-w-6xl min-w-0 flex-1 p-6 print:max-w-none print:p-0">
        {children}
      </div>
    </div>
  );
}
