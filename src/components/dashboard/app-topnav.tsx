"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  Receipt,
  ShoppingCart,
  Users,
  Package,
  BarChart3,
  ShieldCheck,
  Settings,
  Search,
  Bell,
  Menu,
  ChevronDown,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
};
type BusinessType = "AGRO" | "TYRE" | "COMMON";

function initials(value: string): string {
  const parts = value.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const second = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + second).toUpperCase() || "?";
}

function buildNavItems(businessType: BusinessType, lowStockCount: number): NavItem[] {
  return [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/invoices", label: "Invoices", icon: Receipt },
    { href: "/dashboard/purchases", label: "Purchases", icon: ShoppingCart },
    { href: "/dashboard/parties", label: "Parties", icon: Users },
    {
      href: "/dashboard/products",
      label: "Products",
      icon: Package,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
    },
    { href: "/dashboard/reports", label: "Reports", icon: BarChart3 },
    ...(businessType === "TYRE"
      ? [{ href: "/dashboard/warranty-lookup", label: "Warranty", icon: ShieldCheck }]
      : []),
  ];
}

export function AppTopNav({
  tenantName,
  businessType,
  userName,
  dueCount,
  lowStockCount,
}: {
  tenantName: string;
  businessType: BusinessType;
  userName: string;
  dueCount: number;
  lowStockCount: number;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const logoutFormRef = useRef<HTMLFormElement>(null);
  const itemRefs = useRef(new Map<string, HTMLAnchorElement>());
  const [highlight, setHighlight] = useState<{ left: number; width: number } | null>(null);

  const items = buildNavItems(businessType, lowStockCount);
  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  function repositionHighlight() {
    const active = items.find((item) => isActive(item.href));
    const el = active ? itemRefs.current.get(active.href) : undefined;
    if (el) setHighlight({ left: el.offsetLeft, width: el.offsetWidth });
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(repositionHighlight, [pathname]);

  useEffect(() => {
    window.addEventListener("resize", repositionHighlight);
    return () => window.removeEventListener("resize", repositionHighlight);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  function openSearch() {
    setSearchOpen(true);
    requestAnimationFrame(() => searchInputRef.current?.focus());
  }

  return (
    <header className="bg-card sticky top-0 z-20 flex items-center gap-2 border-b px-3 py-2.5 shadow-xs sm:gap-4 sm:px-4 print:hidden">
      {/* mobile menu */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="shrink-0 lg:hidden"
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
            <span className="bg-primary text-primary-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
              <Receipt className="size-4" />
            </span>
            <span className="text-sm font-bold">Universal Billing</span>
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
                {!!item.badge && (
                  <span className="bg-destructive text-destructive-foreground ml-auto flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
            <div className="bg-border my-1 h-px" />
            <Link
              href="/dashboard/settings"
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive("/dashboard/settings")
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              )}
            >
              <Settings className="size-4" />
              Settings
            </Link>
          </nav>
        </SheetContent>
      </Sheet>

      {/* brand */}
      <Link
        href="/dashboard"
        className="flex shrink-0 items-center gap-2"
        aria-label="Universal Billing System"
      >
        <span className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-lg">
          <Receipt className="size-4" />
        </span>
        <span className="hidden text-sm font-bold sm:inline">Universal Billing</span>
      </Link>

      {/* segmented pill nav */}
      <nav className="bg-secondary/60 relative hidden min-w-0 flex-1 items-center gap-0.5 overflow-x-auto rounded-full border p-1 lg:flex">
        {highlight && (
          <span
            aria-hidden
            className="bg-card absolute top-1 left-0 h-[calc(100%-8px)] rounded-full shadow-sm transition-[transform,width] duration-300 ease-out"
            style={{ width: highlight.width, transform: `translateX(${highlight.left}px)` }}
          />
        )}
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            ref={(el) => {
              if (el) itemRefs.current.set(item.href, el);
            }}
            className={cn(
              "relative z-10 flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
              isActive(item.href) ? "text-accent-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon className="size-4" />
            {item.label}
            {!!item.badge && (
              <span className="bg-destructive text-destructive-foreground flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold">
                {item.badge}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* right actions */}
      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        <div
          className={cn(
            "flex items-center overflow-hidden rounded-lg border border-transparent transition-[width] duration-200",
            searchOpen ? "bg-secondary/60 border-input w-44 sm:w-56" : "w-8"
          )}
        >
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0"
            aria-label="Search"
            onClick={openSearch}
          >
            <Search className="size-4" />
          </Button>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search invoices, parties…"
            className="placeholder:text-muted-foreground w-full bg-transparent pr-2 text-sm outline-none"
            onBlur={(e) => {
              if (!e.target.value) setSearchOpen(false);
            }}
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            className="hover:bg-secondary/60 relative flex size-8 shrink-0 items-center justify-center rounded-lg outline-none transition-colors"
            aria-label={dueCount > 0 ? `${dueCount} invoices need follow-up` : "Notifications"}
          >
            <Bell className="text-muted-foreground size-4" />
            {(dueCount > 0 || lowStockCount > 0) && (
              <span className="border-card bg-destructive absolute top-1 right-1 size-2 rounded-full border" />
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel>Needs attention</DropdownMenuLabel>
            {dueCount > 0 && (
              <DropdownMenuItem
                render={<Link href="/dashboard/invoices?status=due" />}
                className="flex-col items-start gap-0.5 py-2"
              >
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="bg-destructive size-1.5 shrink-0 rounded-full" />
                  {dueCount} invoice{dueCount === 1 ? "" : "s"} overdue
                </span>
                <span className="text-muted-foreground pl-3 text-xs">Tap to follow up</span>
              </DropdownMenuItem>
            )}
            {lowStockCount > 0 && (
              <DropdownMenuItem
                render={<Link href="/dashboard/products/low-stock" />}
                className="flex-col items-start gap-0.5 py-2"
              >
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="bg-warning size-1.5 shrink-0 rounded-full" />
                  {lowStockCount} item{lowStockCount === 1 ? "" : "s"} low on stock
                </span>
                <span className="text-muted-foreground pl-3 text-xs">Reorder soon</span>
              </DropdownMenuItem>
            )}
            {dueCount === 0 && lowStockCount === 0 && (
              <p className="text-muted-foreground px-2 py-3 text-center text-sm">
                You&apos;re all caught up.
              </p>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger className="hover:bg-secondary/60 border-input flex shrink-0 items-center gap-1.5 rounded-full border py-1 pr-2 pl-1 outline-none transition-colors">
            <span className="bg-accent text-accent-foreground flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold">
              {initials(userName)}
            </span>
            <ChevronDown className="text-muted-foreground size-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <div className="flex items-center gap-2.5 px-1.5 py-1.5">
              <span className="bg-accent text-accent-foreground flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold">
                {initials(userName)}
              </span>
              <div className="flex min-w-0 flex-col leading-tight">
                <span className="truncate text-sm font-semibold">{userName}</span>
                <span className="text-muted-foreground truncate text-xs">{tenantName}</span>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/dashboard/settings" />}>
              <Settings />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => logoutFormRef.current?.requestSubmit()}>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <form ref={logoutFormRef} action={logout} className="hidden" />
      </div>
    </header>
  );
}
