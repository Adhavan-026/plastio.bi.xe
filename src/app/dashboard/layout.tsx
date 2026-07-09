import Link from "next/link";
import { Search, Plus } from "lucide-react";
import { auth } from "@/auth";
import { getTenantContext } from "@/lib/tenant-db";
import { prisma } from "@/lib/prisma";
import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { tenantId, role } = await getTenantContext();
  const [tenant, session] = await Promise.all([
    prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } }),
    auth(),
  ]);
  const userName = session?.user?.name ?? "User";

  return (
    <SidebarProvider>
      <AppSidebar tenantName={tenant.name} businessType={tenant.businessType} role={role} userName={userName} />
      <SidebarInset className="min-w-0">
        <header className="flex items-center justify-between gap-4 border-b p-4 print:hidden">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <SidebarTrigger />
            <div className="border-input bg-secondary/40 text-muted-foreground hidden max-w-sm flex-1 items-center gap-2 rounded-lg border px-3 py-1.5 sm:flex">
              <Search className="size-4 shrink-0" />
              <input
                type="text"
                placeholder="Search invoices, parties, items..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button render={<Link href="/dashboard/invoices/new" />} nativeButton={false} size="sm">
              <Plus /> New Sale
            </Button>
            <ThemeToggle />
            <form action={logout}>
              <Button variant="outline" size="sm" type="submit">
                Log out
              </Button>
            </form>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl min-w-0 flex-1 p-6 print:max-w-none print:p-0">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
