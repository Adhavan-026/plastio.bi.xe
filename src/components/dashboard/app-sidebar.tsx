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
} from "@/components/ui/sidebar";

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };
type NavGroup = { label: string; items: NavItem[] };

export function AppSidebar({
  tenantName,
  businessType,
  role,
}: {
  tenantName: string;
  businessType: "AGRO" | "TYRE" | "COMMON";
  role: string;
}) {
  const pathname = usePathname();

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
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/dashboard" />} isActive={pathname === "/dashboard"}>
              <LayoutDashboard />
              <div className="flex flex-col leading-tight">
                <span className="font-semibold">{tenantName}</span>
                <span className="text-sidebar-foreground/60 text-xs">
                  {businessType} &middot; {role}
                </span>
              </div>
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
            >
              <Settings />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
