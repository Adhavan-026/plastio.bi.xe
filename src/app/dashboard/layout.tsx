import { getTenantContext } from "@/lib/tenant-db";
import { prisma } from "@/lib/prisma";
import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { tenantId, role } = await getTenantContext();
  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } });

  return (
    <SidebarProvider>
      <AppSidebar tenantName={tenant.name} businessType={tenant.businessType} role={role} />
      <SidebarInset>
        <header className="flex items-center justify-between gap-4 border-b p-4 print:hidden">
          <SidebarTrigger />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <form action={logout}>
              <Button variant="outline" size="sm" type="submit">
                Log out
              </Button>
            </form>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 p-6 print:max-w-none print:p-0">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
