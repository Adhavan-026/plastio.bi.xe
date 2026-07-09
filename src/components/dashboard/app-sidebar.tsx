"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  ShoppingCart,
  Users,
  Package,
  AlertTriangle,
  CalendarClock,
  BarChart3,
  ShieldCheck,
  Settings,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };
type NavGroup = { label: string; items: NavItem[] };

function initials(value: string): string {
  const parts = value.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const second = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + second).toUpperCase() || "?";
}

export function AppSidebar({
  tenantName,
  businessType,
  role,
  userName,
}: {
  tenantName: string;
  businessType: "AGRO" | "TYRE" | "COMMON";
  role: string;
  userName: string;
}) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const closeMobile = () => setOpenMobile(false);

  const inventoryItems: NavItem[] = [
    { href: "/dashboard/products", label: "Products", icon: Package },
    { href: "/dashboard/products/low-stock", label: "Low stock", icon: AlertTriangle },
  ];
  if (businessType === "AGRO") {
    inventoryItems.push({
      href: "/dashboard/products/expiry-alerts",
      label: "Expiry alerts",
      icon: CalendarClock,
    });
  }

  const toolsItems: NavItem[] = [];
  if (businessType === "TYRE") {
    toolsItems.push({ href: "/dashboard/warranty-lookup", label: "Warranty", icon: ShieldCheck });
  }

  const groups: NavGroup[] = [
    {
      label: "Billing",
      items: [
        { href: "/dashboard/invoices", label: "Invoices", icon: Receipt },
        { href: "/dashboard/purchases", label: "Purchases", icon: ShoppingCart },
        { href: "/dashboard/parties", label: "Parties", icon: Users },
      ],
    },
    { label: "Inventory", items: inventoryItems },
    { label: "Reports", items: [{ href: "/dashboard/reports", label: "Reports", icon: BarChart3 }] },
    ...(toolsItems.length ? [{ label: "Tools", items: toolsItems }] : []),
  ];

  const isActive = (href: string) => (href === "/dashboard" ? pathname === href : pathname.startsWith(href));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2.5 px-2 py-1.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <div className="from-primary to-primary/70 text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-xs font-bold">
            {initials(tenantName)}
          </div>
          <div className="flex min-w-0 flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-semibold">{tenantName}</span>
            <span className="text-sidebar-foreground/55 truncate text-xs">{businessType}</span>
          </div>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton render={<Link href="/dashboard" />} isActive={pathname === "/dashboard"} onClick={closeMobile}>
              <LayoutDashboard />
              <span>Dashboard</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={isActive(item.href)}
                      tooltip={item.label}
                      onClick={closeMobile}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link href="/dashboard/settings" />}
              isActive={isActive("/dashboard/settings")}
              tooltip="Settings"
              onClick={closeMobile}
            >
              <Settings />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="border-sidebar-border mt-1 flex items-center gap-2.5 border-t px-2 pt-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <div className="bg-sidebar-accent text-sidebar-accent-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold">
            {initials(userName)}
          </div>
          <div className="flex min-w-0 flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-medium">{userName}</span>
            <span className="text-sidebar-foreground/55 truncate text-xs">{role}</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
