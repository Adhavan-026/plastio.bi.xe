import Link from "next/link";
import { getTenantContext } from "@/lib/tenant-db";
import { prisma } from "@/lib/prisma";
import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

const BASE_NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/products", label: "Products" },
  { href: "/dashboard/parties", label: "Parties" },
  { href: "/dashboard/invoices", label: "Invoices" },
  { href: "/dashboard/purchases", label: "Purchases" },
  { href: "/dashboard/reports", label: "Reports" },
];

const MODULE_NAV_LINKS = {
  AGRO: [{ href: "/dashboard/products/expiry-alerts", label: "Expiry alerts" }],
  TYRE: [{ href: "/dashboard/warranty-lookup", label: "Warranty" }],
  COMMON: [],
} as const;

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { tenantId, role } = await getTenantContext();
  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } });

  const navLinks = [
    ...BASE_NAV_LINKS,
    ...MODULE_NAV_LINKS[tenant.businessType],
    { href: "/dashboard/settings", label: "Settings" },
  ];

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b print:hidden">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 p-4">
          <div className="flex items-center gap-6">
            <div>
              <p className="font-semibold leading-tight">{tenant.name}</p>
              <p className="text-muted-foreground text-xs">
                {tenant.businessType} &middot; {role}
              </p>
            </div>
            <nav className="flex flex-wrap gap-1">
              {navLinks.map((link) => (
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
      <main className="mx-auto w-full max-w-6xl flex-1 p-6 print:max-w-none print:p-0">{children}</main>
    </div>
  );
}
