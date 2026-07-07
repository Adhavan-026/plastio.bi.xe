import Link from "next/link";
import { getTenantDb } from "@/lib/tenant-db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const db = await getTenantDb();

  const [productCount, partyCount, invoiceCount, unpaidInvoices] = await Promise.all([
    db.product.count({ where: { isActive: true } }),
    db.party.count({ where: { isActive: true } }),
    db.invoice.count({ where: { type: "SALES" } }),
    db.invoice.count({ where: { type: "SALES", paymentStatus: { in: ["UNPAID", "PARTIAL"] } } }),
  ]);

  const cards = [
    { href: "/dashboard/products", title: "Products", value: productCount },
    { href: "/dashboard/parties", title: "Parties", value: partyCount },
    { href: "/dashboard/invoices", title: "Sales invoices", value: invoiceCount },
    { href: "/dashboard/invoices?status=due", title: "Invoices with dues", value: unpaidInvoices },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {cards.map((card) => (
        <Link key={card.href} href={card.href}>
          <Card className="transition-colors hover:bg-muted/50">
            <CardHeader>
              <CardDescription>{card.title}</CardDescription>
              <CardTitle className="text-2xl">{card.value}</CardTitle>
            </CardHeader>
            <CardContent />
          </Card>
        </Link>
      ))}
    </div>
  );
}
