"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Receipt,
  ShoppingCart,
  Users,
  Package,
  AlertTriangle,
  BarChart3,
  ShieldCheck,
  Settings,
  Search,
  Bell,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };
type BusinessType = "AGRO" | "TYRE" | "COMMON";

function initials(value: string): string {
  const parts = value.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const second = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + second).toUpperCase() || "?";
}

const BUSINESS_LABEL: Record<BusinessType, string> = {
  AGRO: "Agro Shop",
  TYRE: "Tyre Shop",
  COMMON: "Billing",
};

function buildNavItems(businessType: BusinessType): NavItem[] {
  return [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/invoices", label: "Invoices", icon: Receipt },
    { href: "/dashboard/purchases", label: "Purchases", icon: ShoppingCart },
    { href: "/dashboard/parties", label: "Parties", icon: Users },
    { href: "/dashboard/products", label: "Products", icon: Package },
    { href: "/dashboard/products/low-stock", label: "Low Stock", icon: AlertTriangle },
    { href: "/dashboard/reports", label: "Reports", icon: BarChart3 },
    ...(businessType === "TYRE"
      ? [{ href: "/dashboard/warranty-lookup", label: "Warranty", icon: ShieldCheck }]
      : []),
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ];
}

export function AppTopNav({
  tenantName,
  businessType,
  role,
  userName,
  dueCount,
}: {
  tenantName: string;
  businessType: BusinessType;
  role: string;
  userName: string;
  dueCount: number;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const items = buildNavItems(businessType);
  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  return (
    <header className="bg-card sticky top-0 z-20 flex items-center gap-2 border-b px-3 py-2.5 shadow-xs sm:gap-4 sm:px-4 print:hidden">
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="shrink-0 md:hidden"
          aria-label="Open menu"
          onClick={() => setMobileOpen(true)}
        >
          <Menu />
        </Button>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
            <SheetDescription>Dashboard navigation menu.</SheetDescription>
          </SheetHeader>
          <div className="flex items-center gap-2.5 border-b p-4">
            <div className="bg-primary text-primary-foreground flex size-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold">
              {initials(tenantName)}
            </div>
            <div className="flex min-w-0 flex-col leading-tight">
              <span className="truncate text-sm font-bold">{tenantName}</span>
              <span className="text-muted-foreground truncate text-xs">
                {BUSINESS_LABEL[businessType]}
              </span>
            </div>
          </div>
          <nav className="flex flex-col gap-1 p-3">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive(item.href)
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>

      <Link href="/dashboard" className="flex shrink-0 items-center gap-2.5">
        <div className="bg-primary text-primary-foreground flex size-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold">
          {initials(tenantName)}
        </div>
        <div className="hidden min-w-0 flex-col leading-tight sm:flex">
          <span className="truncate text-sm font-bold">{tenantName}</span>
          <span className="text-muted-foreground truncate text-xs">
            {BUSINESS_LABEL[businessType]}
          </span>
        </div>
      </Link>

      <nav className="hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto md:flex">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
              isActive(item.href)
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
        <div className="border-input bg-secondary/40 text-muted-foreground hidden max-w-52 items-center gap-2 rounded-lg border px-3 py-1.5 lg:flex">
          <Search className="size-4 shrink-0" />
          <input
            type="text"
            placeholder="Search invoices, parties..."
            className="placeholder:text-muted-foreground w-full bg-transparent text-sm outline-none"
          />
        </div>
        <Link
          href="/dashboard/invoices?status=due"
          className="hover:bg-secondary/60 relative flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors"
          aria-label={dueCount > 0 ? `${dueCount} invoices need follow-up` : "Notifications"}
        >
          <Bell className="text-muted-foreground size-4" />
          {dueCount > 0 && (
            <span className="border-card bg-destructive absolute top-1 right-1 size-2 rounded-full border" />
          )}
        </Link>
        <ThemeToggle />
        <div className="hidden items-center gap-2 pl-1 md:flex">
          <div className="bg-accent text-accent-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold">
            {initials(userName)}
          </div>
          <div className="hidden min-w-0 flex-col leading-tight lg:flex">
            <span className="max-w-24 truncate text-xs font-semibold">{userName}</span>
            <span className="text-muted-foreground truncate text-[10px]">{role}</span>
          </div>
        </div>
        <form action={logout}>
          <Button variant="outline" size="sm" type="submit">
            Log out
          </Button>
        </form>
      </div>
    </header>
  );
}
