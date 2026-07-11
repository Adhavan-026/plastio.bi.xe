import Link from "next/link";
import {
  IndianRupee,
  FileText,
  AlertTriangle,
  CalendarClock,
  Package,
  Users,
  TrendingUp,
  Zap,
  ShoppingCart,
  UserPlus,
  PackagePlus,
} from "lucide-react";
import { auth } from "@/auth";
import { getTenantDb, getTenantContext } from "@/lib/tenant-db";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { isLowStock } from "@/lib/billing/low-stock";
import { getExpiryStatus } from "@/lib/billing/expiry";
import { buildDailySalesTrend } from "@/lib/billing/sales-trend";
import { RevenueChart } from "@/components/dashboard/revenue-chart";

const TOP_ITEMS_DAYS = 30;

const RANGE_TABS = [
  { key: "30d", label: "30D", days: 30, blurb: "Last 30 days revenue overview" },
  { key: "3m", label: "3M", days: 90, blurb: "Last 3 months revenue overview" },
  { key: "1y", label: "1Y", days: 365, blurb: "Last 12 months revenue overview" },
] as const;

const KPI_TONE = {
  blue: "bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",
  rose: "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400",
  amber: "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
  purple: "bg-purple-100 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400",
  emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
  teal: "bg-teal-100 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400",
} as const;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range: rangeParam } = await searchParams;
  const activeRange = RANGE_TABS.find((r) => r.key === rangeParam) ?? RANGE_TABS[0];

  const { tenantId } = await getTenantContext();
  const db = await getTenantDb();
  const session = await auth();
  const firstName = (session?.user?.name ?? "there").trim().split(/\s+/)[0];

  const trendStart = new Date();
  trendStart.setDate(trendStart.getDate() - (activeRange.days - 1));
  trendStart.setHours(0, 0, 0, 0);

  const topItemsStart = new Date();
  topItemsStart.setDate(topItemsStart.getDate() - (TOP_ITEMS_DAYS - 1));
  topItemsStart.setHours(0, 0, 0, 0);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    tenant,
    products,
    partyCount,
    invoiceCount,
    unpaidInvoices,
    batches,
    recentSales,
    todaysSales,
    topItems,
  ] = await Promise.all([
    prisma.tenant.findUniqueOrThrow({ where: { id: tenantId }, select: { businessType: true } }),
    db.product.findMany({
      where: { isActive: true },
      select: { stockQty: true, lowStockAlert: true },
    }),
    db.party.count({ where: { isActive: true } }),
    db.invoice.count({ where: { type: "SALES" } }),
    db.invoice.count({ where: { type: "SALES", paymentStatus: { in: ["UNPAID", "PARTIAL"] } } }),
    db.stockBatch.findMany({ where: { quantity: { gt: 0 } }, select: { expiryDate: true } }),
    db.invoice.findMany({
      where: { type: "SALES", invoiceDate: { gte: trendStart } },
      select: { invoiceDate: true, totalAmount: true },
    }),
    db.invoice.aggregate({
      where: { type: "SALES", invoiceDate: { gte: todayStart } },
      _sum: { totalAmount: true },
    }),
    db.invoiceItem.groupBy({
      by: ["description"],
      where: { invoice: { type: "SALES", invoiceDate: { gte: topItemsStart } } },
      _sum: { totalAmount: true, quantity: true },
      orderBy: { _sum: { totalAmount: "desc" } },
      take: 5,
    }),
  ]);

  const lowStockCount = products.filter((p) => isLowStock(p.stockQty, p.lowStockAlert)).length;
  const isAgro = tenant.businessType === "AGRO";
  const expiryAlertCount = isAgro
    ? batches.filter((b) => ["expired", "expiring_soon"].includes(getExpiryStatus(b.expiryDate)))
        .length
    : 0;
  const trend = buildDailySalesTrend(recentSales, activeRange.days);

  const cards = [
    {
      href: "/dashboard/invoices",
      title: "Today's Sales",
      value: `₹${Number(todaysSales._sum.totalAmount ?? 0).toFixed(2)}`,
      caption: "Booked today",
      icon: IndianRupee,
      tone: "blue" as const,
    },
    {
      href: "/dashboard/invoices?status=due",
      title: "Invoices Due",
      value: unpaidInvoices,
      caption: unpaidInvoices > 0 ? "Needs follow-up" : "All settled",
      icon: FileText,
      tone: "rose" as const,
      badge: unpaidInvoices > 0 ? "Action" : undefined,
    },
    {
      href: "/dashboard/products/low-stock",
      title: "Low Stock",
      value: lowStockCount,
      caption: lowStockCount > 0 ? "Reorder needed" : "Stock healthy",
      icon: AlertTriangle,
      tone: "amber" as const,
    },
    ...(isAgro
      ? [
          {
            href: "/dashboard/products/expiry-alerts",
            title: "Expiry Alerts",
            value: expiryAlertCount,
            caption: expiryAlertCount > 0 ? "Review batches" : "Nothing expiring",
            icon: CalendarClock,
            tone: "amber" as const,
          },
        ]
      : []),
    {
      href: "/dashboard/products",
      title: "Products",
      value: products.length,
      caption: "Active items",
      icon: Package,
      tone: "purple" as const,
    },
    {
      href: "/dashboard/parties",
      title: "Parties",
      value: partyCount,
      caption: "Customers & suppliers",
      icon: Users,
      tone: "emerald" as const,
    },
    {
      href: "/dashboard/invoices",
      title: "Total Invoices",
      value: invoiceCount,
      caption: "All time",
      icon: TrendingUp,
      tone: "teal" as const,
    },
  ];

  const quickActions = [
    { href: "/dashboard/invoices/new", label: "New Sale", icon: Zap, primary: true },
    { href: "/dashboard/purchases/new", label: "New Purchase", icon: ShoppingCart, primary: false },
    { href: "/dashboard/parties/new", label: "Add Party", icon: UserPlus, primary: false },
    { href: "/dashboard/products/new", label: "Add Item", icon: PackagePlus, primary: false },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Welcome back, {firstName}. Here&apos;s what&apos;s happening today.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 xl:grid-cols-6">
        {cards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="bg-card group flex flex-col gap-3 rounded-2xl border p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <span
                className={cn(
                  "flex size-10 items-center justify-center rounded-xl",
                  KPI_TONE[card.tone]
                )}
              >
                <card.icon className="size-5" />
              </span>
              {card.badge && (
                <span className="bg-destructive/10 text-destructive rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase">
                  {card.badge}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-2xl font-bold tabular-nums tracking-tight">{card.value}</span>
              <span className="text-sm font-semibold">{card.title}</span>
              <span className="text-muted-foreground text-xs">{card.caption}</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-3">
        <div className="bg-card rounded-xl border shadow-sm lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3.5">
            <div>
              <h2 className="text-sm font-bold">Sales Trend</h2>
              <p className="text-muted-foreground text-xs">{activeRange.blurb}</p>
            </div>
            <div className="bg-secondary/50 flex items-center gap-0.5 rounded-lg p-0.5">
              {RANGE_TABS.map((tab) => (
                <Link
                  key={tab.key}
                  href={`/dashboard?range=${tab.key}`}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-semibold transition-colors",
                    tab.key === activeRange.key
                      ? "bg-card shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="p-5 pt-4">
            <RevenueChart data={trend} />
          </div>
        </div>

        <div className="flex flex-col gap-3.5">
          <div className="bg-card rounded-xl border shadow-sm">
            <div className="border-b px-5 py-3.5">
              <h2 className="text-sm font-bold">Quick Actions</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 p-4">
              {quickActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 rounded-xl border p-4 text-center transition-colors",
                    action.primary
                      ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                      : "bg-secondary/40 hover:border-primary hover:bg-accent"
                  )}
                >
                  <action.icon className="size-5" />
                  <span className="text-xs font-semibold">{action.label}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-xl border shadow-sm">
            <div className="border-b px-5 py-3.5">
              <h2 className="text-sm font-bold">Top Items</h2>
              <p className="text-muted-foreground text-xs">Last {TOP_ITEMS_DAYS} days</p>
            </div>
            <ul className="flex flex-col gap-3 p-5 pt-4 text-sm">
              {topItems.length === 0 && <li className="text-muted-foreground">No sales yet.</li>}
              {topItems.map((item) => (
                <li key={item.description} className="flex items-center justify-between gap-2">
                  <span className="truncate">{item.description}</span>
                  <span className="text-muted-foreground shrink-0 tabular-nums">
                    ₹{Number(item._sum.totalAmount ?? 0).toFixed(0)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
