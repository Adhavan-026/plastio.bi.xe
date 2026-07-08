import Link from "next/link";
import { getTenantDb, getTenantContext } from "@/lib/tenant-db";
import { prisma } from "@/lib/prisma";
import { isLowStock } from "@/lib/billing/low-stock";
import { getExpiryStatus } from "@/lib/billing/expiry";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const { tenantId } = await getTenantContext();
  const db = await getTenantDb();

  const [tenant, products, partyCount, invoiceCount, unpaidInvoices, batches] = await Promise.all([
    prisma.tenant.findUniqueOrThrow({ where: { id: tenantId }, select: { businessType: true } }),
    db.product.findMany({
      where: { isActive: true },
      select: { stockQty: true, lowStockAlert: true },
    }),
    db.party.count({ where: { isActive: true } }),
    db.invoice.count({ where: { type: "SALES" } }),
    db.invoice.count({ where: { type: "SALES", paymentStatus: { in: ["UNPAID", "PARTIAL"] } } }),
    db.stockBatch.findMany({ where: { quantity: { gt: 0 } }, select: { expiryDate: true } }),
  ]);

  const lowStockCount = products.filter((p) => isLowStock(p.stockQty, p.lowStockAlert)).length;
  const isAgro = tenant.businessType === "AGRO";
  const expiryAlertCount = isAgro
    ? batches.filter((b) => ["expired", "expiring_soon"].includes(getExpiryStatus(b.expiryDate)))
        .length
    : 0;

  const cards = [
    { href: "/dashboard/products", title: "Products", value: products.length },
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
    { href: "/dashboard/parties", title: "Parties", value: partyCount },
    { href: "/dashboard/invoices", title: "Sales invoices", value: invoiceCount },
    { href: "/dashboard/invoices?status=due", title: "Invoices with dues", value: unpaidInvoices },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
      {cards.map((card) => (
        <Link key={card.href} href={card.href}>
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
  );
}
