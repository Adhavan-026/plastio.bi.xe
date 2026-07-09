import Link from "next/link";
import {
  TrendingUp,
  Clock,
  AlertTriangle,
  CalendarClock,
  Package,
  Users,
  Receipt,
  FilePlus,
  ShoppingCart,
  UserPlus,
  PackagePlus,
} from "lucide-react";
import { getTenantDb, getTenantContext } from "@/lib/tenant-db";
import { prisma } from "@/lib/prisma";
import { isLowStock } from "@/lib/billing/low-stock";
import { getExpiryStatus } from "@/lib/billing/expiry";
import { buildDailySalesTrend } from "@/lib/billing/sales-trend";
import { RevenueChart } from "@/components/dashboard/revenue-chart";

const TREND_DAYS = 30;

const KPI_TONE = {
  blue: "bg-accent text-accent-foreground",
  green: "bg-success/10 text-success",
  amber: "bg-warning/10 text-warning",
  red: "bg-destructive/10 text-destructive",
} as const;

export default async function DashboardPage() {
  const { tenantId } = await getTenantContext();
  const db = await getTenantDb();

  const trendStart = new Date();
  trendStart.setDate(trendStart.getDate() - (TREND_DAYS - 1));
  trendStart.setHours(0, 0, 0, 0);

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
      where: { invoice: { type: "SALES", invoiceDate: { gte: trendStart } } },
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
  const trend = buildDailySalesTrend(recentSales, TREND_DAYS);

  const cards = [
    {
      href: "/dashboard/invoices",
      title: "Today's sales",
      value: `₹${Number(todaysSales._sum.totalAmount ?? 0).toFixed(2)}`,
      caption: "Booked today",
      icon: TrendingUp,
      tone: "blue" as const,
    },
    {
      href: "/dashboard/invoices?status=due",
      title: "Invoices with dues",
      value: unpaidInvoices,
      caption: unpaidInvoices > 0 ? "Needs follow-up" : "All settled",
      icon: Clock,
      tone: unpaidInvoices > 0 ? ("red" as const) : ("green" as const),
    },
    {
      href: "/dashboard/products/low-stock",
      title: "Low stock",
      value: lowStockCount,
      caption: lowStockCount > 0 ? "Reorder needed" : "Stock healthy",
      icon: AlertTriangle,
      tone: lowStockCount > 0 ? ("amber" as const) : ("green" as const),
    },
    ...(isAgro
      ? [
          {
            href: "/dashboard/products/expiry-alerts",
            title: "Expiry alerts",
            value: expiryAlertCount,
            caption: expiryAlertCount > 0 ? "Review batches" : "Nothing expiring",
            icon: CalendarClock,
            tone: expiryAlertCount > 0 ? ("amber" as const) : ("green" as const),
          },
        ]
      : []),
    {
      href: "/dashboard/products",
      title: "Products",
      value: products.length,
      caption: "Active items",
      icon: Package,
      tone: "blue" as const,
    },
    {
      href: "/dashboard/parties",
      title: "Parties",
      value: partyCount,
      caption: "Customers & suppliers",
      icon: Users,
      tone: "blue" as const,
    },
    {
      href: "/dashboard/invoices",
      title: "Sales invoices",
      value: invoiceCount,
      caption: "All time",
      icon: Receipt,
      tone: "green" as const,
    },
  ];

  const quickActions = [
    { href: "/dashboard/invoices/new", label: "New Sale", icon: FilePlus },
    { href: "/dashboard/purchases/new", label: "New Purchase", icon: ShoppingCart },
    { href: "/dashboard/parties/new", label: "Add Party", icon: UserPlus },
    { href: "/dashboard/products/new", label: "Add Item", icon: PackagePlus },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="bg-card flex flex-col gap-2.5 rounded-xl border p-4 shadow-sm transition-colors hover:bg-secondary/40"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                {card.title}
              </span>
              <span className={`flex size-7 shrink-0 items-center justify-center rounded-md ${KPI_TONE[card.tone]}`}>
                <card.icon className="size-3.5" />
              </span>
            </div>
            <span className="text-2xl font-bold tabular-nums tracking-tight">{card.value}</span>
            <span className="text-muted-foreground text-xs font-medium">{card.caption}</span>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-3">
        <div className="bg-card rounded-xl border shadow-sm lg:col-span-2">
          <div className="border-b px-5 py-3.5">
            <h2 className="text-sm font-bold">Sales trend (last {TREND_DAYS} days)</h2>
          </div>
          <div className="p-5 pt-4">
            <RevenueChart data={trend} />
          </div>
        </div>

        <div className="flex flex-col gap-3.5">
          <div className="bg-card rounded-xl border shadow-sm">
            <div className="border-b px-5 py-3.5">
              <h2 className="text-sm font-bold">Quick actions</h2>
            </div>
            <div className="grid grid-cols-2 gap-2.5 p-4">
              {quickActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="bg-secondary/40 hover:border-primary hover:bg-accent flex flex-col gap-2 rounded-lg border p-3 transition-colors"
                >
                  <action.icon className="text-primary size-4" />
                  <span className="text-xs font-semibold">{action.label}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-xl border shadow-sm">
            <div className="border-b px-5 py-3.5">
              <h2 className="text-sm font-bold">Top items (last {TREND_DAYS} days)</h2>
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
