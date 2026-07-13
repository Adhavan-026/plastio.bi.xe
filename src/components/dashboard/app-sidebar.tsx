"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
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
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/logo";

export type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
};
export type BusinessType = "AGRO" | "TYRE" | "COMMON";

export function buildNavItems(businessType: BusinessType, lowStockCount: number): NavItem[] {
  return [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/invoices", label: "Invoices", icon: Receipt },
    { href: "/dashboard/purchases", label: "Purchases", icon: ShoppingCart },
    { href: "/dashboard/parties", label: "Parties", icon: Users },
    { href: "/dashboard/products", label: "Products", icon: Package },
    {
      href: "/dashboard/products/low-stock",
      label: "Low Stock",
      icon: AlertTriangle,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
    },
    { href: "/dashboard/reports", label: "Reports", icon: BarChart3 },
    ...(businessType === "TYRE"
      ? [{ href: "/dashboard/warranty-lookup", label: "Warranty", icon: ShieldCheck }]
      : []),
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ];
}

const COLLAPSE_KEY = "sidebar-collapsed";

export function AppSidebar({
  tenantName,
  businessType,
  lowStockCount,
}: {
  tenantName: string;
  businessType: BusinessType;
  lowStockCount: number;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // localStorage only exists client-side, so this must run in an effect.
  useEffect(() => {
    if (localStorage.getItem(COLLAPSE_KEY) === "1") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCollapsed(true);
    }
  }, []);

  function toggle() {
    setCollapsed((current) => {
      const next = !current;
      localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      return next;
    });
  }

  const items = buildNavItems(businessType, lowStockCount);
  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  return (
    <aside
      className={cn(
        "bg-sidebar sticky top-0 hidden h-svh shrink-0 flex-col border-r transition-[width] duration-200 lg:flex print:hidden",
        collapsed ? "w-[68px]" : "w-64"
      )}
    >
      <div className="flex items-center gap-2.5 border-b px-4 py-4">
        <LogoMark className="size-9 shrink-0" />
        {!collapsed && (
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-sm font-bold">{tenantName}</span>
            <span className="text-muted-foreground truncate text-[11px]">Management System</span>
          </div>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            title={collapsed ? item.label : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isActive(item.href)
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              collapsed && "justify-center px-2"
            )}
          >
            <item.icon className="size-[18px] shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
            {!!item.badge && !collapsed && (
              <span className="bg-destructive text-destructive-foreground ml-auto flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold">
                {item.badge}
              </span>
            )}
          </Link>
        ))}
      </nav>

      <div className="border-t p-3">
        <button
          type="button"
          onClick={toggle}
          className="text-muted-foreground hover:bg-secondary hover:text-foreground flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
        >
          {collapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
          {!collapsed && "Collapse"}
        </button>
      </div>
    </aside>
  );
}
