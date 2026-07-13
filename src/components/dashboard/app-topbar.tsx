"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Search,
  Bell,
  Settings,
  HelpCircle,
  ChevronDown,
  LogOut,
  Menu,
  Plus,
  Zap,
  ShoppingCart,
  UserPlus,
  PackagePlus,
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
import { buildNavItems, type BusinessType } from "@/components/dashboard/app-sidebar";
import { LogoMark } from "@/components/logo";

function initials(value: string): string {
  const parts = value.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const second = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + second).toUpperCase() || "?";
}

const NEW_ACTIONS = [
  { href: "/dashboard/invoices/new", label: "New Sale", icon: Zap },
  { href: "/dashboard/purchases/new", label: "New Purchase", icon: ShoppingCart },
  { href: "/dashboard/parties/new", label: "Add Party", icon: UserPlus },
  { href: "/dashboard/products/new", label: "Add Item", icon: PackagePlus },
];

export function AppTopBar({
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
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const logoutFormRef = useRef<HTMLFormElement>(null);

  const items = buildNavItems(businessType, lowStockCount);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey && e.key.toLowerCase() === "q") {
        e.preventDefault();
        router.push("/dashboard/invoices/new");
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router]);

  function openSearch() {
    setSearchOpen(true);
    requestAnimationFrame(() => searchInputRef.current?.focus());
  }

  return (
    <header className="bg-card sticky top-0 z-20 flex items-center gap-2 border-b px-3 py-2.5 shadow-xs sm:gap-3 sm:px-5 print:hidden">
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
            <LogoMark className="size-9 shrink-0" />
            <span className="truncate text-sm font-bold">{tenantName}</span>
          </div>
          <nav className="flex flex-col gap-1 p-3">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="text-muted-foreground hover:bg-secondary hover:text-foreground flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
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
          </nav>
        </SheetContent>
      </Sheet>

      {/* search */}
      <div
        className={cn(
          "flex items-center overflow-hidden rounded-lg border border-transparent transition-[width] duration-200",
          searchOpen ? "bg-secondary/60 border-input w-44 sm:w-64" : "w-8"
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

      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        <DropdownMenu>
          <DropdownMenuTrigger
            className="bg-primary text-primary-foreground hover:bg-primary/90 flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold outline-none transition-colors"
            aria-label="Create new"
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">New</span>
            <span className="hidden text-xs font-normal opacity-80 md:inline">(Ctrl+Q)</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {NEW_ACTIONS.map((action) => (
              <DropdownMenuItem key={action.href} render={<Link href={action.href} />}>
                <action.icon />
                {action.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

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

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="hidden shrink-0 sm:inline-flex"
          aria-label="Settings"
          render={<Link href="/dashboard/settings" />}
          nativeButton={false}
        >
          <Settings className="size-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            className="hover:bg-secondary/60 hidden size-8 shrink-0 items-center justify-center rounded-lg outline-none transition-colors sm:inline-flex"
            aria-label="Help"
          >
            <HelpCircle className="text-muted-foreground size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>Keyboard shortcuts</DropdownMenuLabel>
            <div className="text-muted-foreground flex items-center justify-between px-2 py-1.5 text-sm">
              <span>New sale</span>
              <kbd className="bg-secondary rounded px-1.5 py-0.5 text-xs font-semibold">Ctrl+Q</kbd>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger className="hover:bg-secondary/60 border-input flex shrink-0 items-center gap-1.5 rounded-full border py-1 pr-2 pl-1 outline-none transition-colors">
            <span className="bg-accent text-accent-foreground flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold">
              {initials(userName)}
            </span>
            <ChevronDown className="text-muted-foreground hidden size-3.5 sm:inline" />
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
