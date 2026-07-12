import Link from "next/link";
import { BackButton } from "@/components/dashboard/back-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const REPORTS = [
  { href: "/dashboard/reports/sales", title: "Sales report", description: "Daily sales totals over a date range" },
  { href: "/dashboard/reports/gst", title: "GST summary", description: "Taxable value and tax collected, by rate slab (GSTR-1 style)" },
  { href: "/dashboard/reports/items", title: "Item-wise sales", description: "Quantity and revenue sold per product" },
  { href: "/dashboard/reports/parties", title: "Party-wise sales", description: "Revenue and dues per customer" },
  { href: "/dashboard/reports/stock", title: "Stock valuation", description: "Current stock quantity and value per product" },
  { href: "/dashboard/reports/profit-loss", title: "Profit & loss", description: "Revenue vs. cost of goods sold over a date range" },
];

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-6">
      <BackButton />
      <h1 className="text-2xl font-semibold">Reports</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map((report) => (
          <Link key={report.href} href={report.href}>
            <Card className="h-full transition-colors hover:bg-muted/50">
              <CardHeader>
                <CardTitle>{report.title}</CardTitle>
                <CardDescription>{report.description}</CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
