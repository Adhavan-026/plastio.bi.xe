import Link from "next/link";
import { Zap, ShoppingCart, UserPlus, PackagePlus } from "lucide-react";
import { auth } from "@/auth";
import { getTenantDb, getTenantContext } from "@/lib/tenant-db";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { isLowStock } from "@/lib/billing/low-stock";
import { getExpiryStatus } from "@/lib/billing/expiry";
import { buildDailyTrend } from "@/lib/billing/sales-trend";
import { buildReceivablesAging } from "@/lib/billing/receivables-aging";
import { getInvoiceStatusLabel } from "@/lib/billing/invoice-status";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { ReceivablesCard } from "@/components/dashboard/receivables-card";
import { RecentInvoicesList } from "@/components/dashboard/recent-invoices-list";
import { BackButton } from "@/components/dashboard/back-button";

const TOP_ITEMS_DAYS = 30;
const RECENT_INVOICES_COUNT = 5;

const RANGE_TABS = [
  { key: "30d", label: "30D", days: 30, blurb: "Last 30 days" },
  { key: "3m", label: "3M", days: 90, blurb: "Last 3 months" },
  { key: "1y", label: "1Y", days: 365, blurb: "Last 12 months" },
] as const;

const KPI_TONE = {
  blue: "bg-chart-2",
  rose: "bg-chart-5",
  amber: "bg-chart-4",
  purple: "bg-chart-3",
  emerald: "bg-chart-1",
  teal: "bg-chart-2",
} as const;

function formatInr(v: number): string {
  return `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

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
    recentPurchases,
    todaysSales,
    topItems,
    receivablesInvoices,
    recentInvoices,
    receiptsAgg,
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
    db.invoice.findMany({
      where: { type: "PURCHASE", invoiceDate: { gte: trendStart } },
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
    db.invoice.findMany({
      where: { type: "SALES", paymentStatus: { in: ["UNPAID", "PARTIAL"] } },
      select: { totalAmount: true, amountPaid: true, invoiceDate: true, dueDate: true },
    }),
    db.invoice.findMany({
      where: { type: "SALES" },
      orderBy: { invoiceDate: "desc" },
      take: RECENT_INVOICES_COUNT,
      select: {
        id: true,
        invoiceNumber: true,
        invoiceDate: true,
        totalAmount: true,
        paymentStatus: true,
        dueDate: true,
        party: { select: { name: true } },
      },
    }),
    db.payment.aggregate({
      where: { paymentDate: { gte: trendStart } },
      _sum: { amount: true },
    }),
  ]);

  const lowStockCount = products.filter((p) => isLowStock(p.stockQty, p.lowStockAlert)).length;
  const isAgro = tenant.businessType === "AGRO";
  const expiryAlertCount = isAgro
    ? batches.filter((b) => ["expired", "expiring_soon"].includes(getExpiryStatus(b.expiryDate)))
        .length
    : 0;
  const trend = buildDailyTrend(recentSales, recentPurchases, activeRange.days);
  const receivablesBuckets = buildReceivablesAging(receivablesInvoices);

  const rangeTotals = {
    sales: trend.reduce((sum, p) => sum + p.sales, 0),
    purchases: trend.reduce((sum, p) => sum + p.purchases, 0),
    receipts: Number(receiptsAgg._sum.amount ?? 0),
  };

  const recentInvoicesForList = recentInvoices.map((invoice) => ({
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    partyName: invoice.party.name,
    invoiceDate: invoice.invoiceDate,
    totalAmount: Number(invoice.totalAmount),
    status: getInvoiceStatusLabel(
      invoice.paymentStatus as "UNPAID" | "PARTIAL" | "PAID",
      invoice.invoiceDate,
      invoice.dueDate
    ),
  }));

  const cards = [
    {
      href: "/dashboard/invoices",
      title: "Today's Sales",
      value: `₹${Number(todaysSales._sum.totalAmount ?? 0).toFixed(2)}`,
      caption: "Booked today",
      tone: "blue" as const,
    },
    {
      href: "/dashboard/invoices?status=due",
      title: "Invoices Due",
      value: unpaidInvoices,
      caption: unpaidInvoices > 0 ? "Needs follow-up" : "All settled",
      tone: "rose" as const,
      badge: unpaidInvoices > 0 ? "Action" : undefined,
    },
    {
      href: "/dashboard/products/low-stock",
      title: "Low Stock",
      value: lowStockCount,
      caption: lowStockCount > 0 ? "Reorder needed" : "Stock healthy",
      tone: "amber" as const,
    },
    ...(isAgro
      ? [
          {
            href: "/dashboard/products/expiry-alerts",
            title: "Expiry Alerts",
            value: expiryAlertCount,
            caption: expiryAlertCount > 0 ? "Review batches" : "Nothing expiring",
            tone: "amber" as const,
          },
        ]
      : []),
    {
      href: "/dashboard/products",
      title: "Products",
      value: products.length,
      caption: "Active items",
      tone: "purple" as const,
    },
    {
      href: "/dashboard/parties",
      title: "Parties",
      value: partyCount,
      caption: "Customers & suppliers",
      tone: "emerald" as const,
    },
    {
      href: "/dashboard/invoices",
      title: "Total Invoices",
      value: invoiceCount,
      caption: "All time",
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
      <BackButton />
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Welcome back, {firstName}. Here&apos;s what&apos;s happening today.
        </p>
      </div>

      <ReceivablesCard buckets={receivablesBuckets} />

      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 xl:grid-cols-6">
        {cards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="bg-card group relative flex flex-col gap-2 overflow-hidden rounded-xl border p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className={cn("absolute inset-x-0 top-0 h-1", KPI_TONE[card.tone])} />
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground truncate text-xs font-semibold tracking-wide uppercase">
                {card.title}
              </span>
              {card.badge && (
                <span className="bg-destructive/10 text-destructive shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase">
                  {card.badge}
                </span>
              )}
            </div>
            <span className="text-2xl font-bold tabular-nums tracking-tight">{card.value}</span>
            <span className="text-muted-foreground text-xs">{card.caption}</span>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-3">
        <div className="bg-card rounded-xl border shadow-sm lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3.5">
            <div>
              <h2 className="text-sm font-bold">Sales and Purchases</h2>
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
          <div className="flex flex-wrap items-center gap-5 border-b px-5 py-3 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="bg-chart-1 size-2 rounded-full" />
              <span className="text-muted-foreground">Total Sales</span>
              <span className="font-bold tabular-nums">{formatInr(rangeTotals.sales)}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="bg-chart-2 size-2 rounded-full" />
              <span className="text-muted-foreground">Total Receipts</span>
              <span className="font-bold tabular-nums">{formatInr(rangeTotals.receipts)}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="bg-chart-3 size-2 rounded-full" />
              <span className="text-muted-foreground">Total Purchases</span>
              <span className="font-bold tabular-nums">{formatInr(rangeTotals.purchases)}</span>
            </span>
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
              {topItems.map((item, index) => (
                <li key={item.description} className="flex items-center gap-3">
                  <span className="bg-secondary text-muted-foreground flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{item.description}</span>
                  <span className="text-muted-foreground shrink-0 tabular-nums">
                    ₹{Number(item._sum.totalAmount ?? 0).toFixed(0)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <RecentInvoicesList invoices={recentInvoicesForList} />
    </div>
  );
}
