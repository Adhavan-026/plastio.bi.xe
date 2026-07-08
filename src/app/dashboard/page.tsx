import Link from "next/link";
import { getTenantDb, getTenantContext } from "@/lib/tenant-db";
import { prisma } from "@/lib/prisma";
import { isLowStock } from "@/lib/billing/low-stock";
import { getExpiryStatus } from "@/lib/billing/expiry";
import { buildDailySalesTrend } from "@/lib/billing/sales-trend";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RevenueChart } from "@/components/dashboard/revenue-chart";

const TREND_DAYS = 30;

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
    },
    { href: "/dashboard/invoices?status=due", title: "Invoices with dues", value: unpaidInvoices },
    { href: "/dashboard/products/low-stock", title: "Low stock", value: lowStockCount, alert: lowStockCount > 0 },
    ...(isAgro
      ? [
          {
            href: "/dashboard/products/expiry-alerts",
            title: "Expiry alerts",
            value: expiryAlertCount,
            alert: expiryAlertCount > 0,
          },
        ]
      : []),
    { href: "/dashboard/products", title: "Products", value: products.length },
    { href: "/dashboard/parties", title: "Parties", value: partyCount },
    { href: "/dashboard/invoices", title: "Sales invoices", value: invoiceCount },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.title} href={card.href}>
            <Card className="transition-colors hover:bg-muted/50">
              <CardHeader>
                <CardDescription>{card.title}</CardDescription>
                <CardTitle className={`text-2xl ${card.alert ? "text-destructive" : ""}`}>
                  {card.value}
                </CardTitle>
              </CardHeader>
              <CardContent />
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Sales trend (last {TREND_DAYS} days)</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={trend} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top items (last {TREND_DAYS} days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-3 text-sm">
              {topItems.length === 0 && <li className="text-muted-foreground">No sales yet.</li>}
              {topItems.map((item) => (
                <li key={item.description} className="flex items-center justify-between gap-2">
                  <span className="truncate">{item.description}</span>
                  <span className="text-muted-foreground shrink-0">
                    ₹{Number(item._sum.totalAmount ?? 0).toFixed(0)}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
