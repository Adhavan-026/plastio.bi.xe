import Link from "next/link";
import { requireActiveSubscription } from "@/lib/billing/subscription";
import { BackButton } from "@/components/dashboard/back-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const REPORTS = [
  { href: "/dashboard/production/reports/yield", title: "Yield history", description: "Input vs. output and yield % per run" },
  { href: "/dashboard/production/reports/wastage", title: "Wastage", description: "Wastage by item and by month" },
  { href: "/dashboard/production/reports/pending-job-work", title: "Pending job work", description: "Goods still with job workers, and what's overdue" },
];

export default async function ProductionReportsPage() {
  await requireActiveSubscription();
  return (
    <div className="flex flex-col gap-6">
      <BackButton />
      <h1 className="text-2xl font-semibold">Production reports</h1>
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
