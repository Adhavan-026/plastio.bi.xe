import Link from "next/link";
import { getTenantContext } from "@/lib/tenant-db";
import { prisma } from "@/lib/prisma";
import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/products", label: "Products" },
  { href: "/dashboard/parties", label: "Parties" },
  { href: "/dashboard/invoices", label: "Invoices" },
  { href: "/dashboard/purchases", label: "Purchases" },
  { href: "/dashboard/settings", label: "Settings" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { tenantId, role } = await getTenantContext();
  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } });

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b print:hidden">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 p-4">
          <div className="flex items-center gap-6">
            <div>
              <p className="font-semibold leading-tight">{tenant.name}</p>
              <p className="text-muted-foreground text-xs">
                {tenant.businessType} &middot; {role}
              </p>
            </div>
            <nav className="flex gap-1">
              {NAV_LINKS.map((link) => (
                <Button key={link.href} render={<Link href={link.href} />} nativeButton={false} variant="ghost" size="sm">
                  {link.label}
                </Button>
              ))}
            </nav>
          </div>
          <form action={logout}>
            <Button variant="outline" size="sm" type="submit">
              Log out
            </Button>
          </form>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 p-6 print:max-w-none print:p-0">{children}</main>
    </div>
  );
}
