import Link from "next/link";
import { ListChecks, PackageCheck, Percent, TriangleAlert, Truck } from "lucide-react";
import { getTenantDb } from "@/lib/tenant-db";
import { requireActiveSubscription } from "@/lib/billing/subscription";
import { BackButton } from "@/components/dashboard/back-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const SECTIONS = [
  { href: "/dashboard/production/boms", title: "Bills of Materials", description: "Define what goes into each finished item" },
  { href: "/dashboard/production/runs", title: "Production Runs", description: "Issue raw material, log outputs, track yield" },
  { href: "/dashboard/production/job-work", title: "Job Work", description: "Goods sent out for outside processing" },
  { href: "/dashboard/production/reports", title: "Reports", description: "Yield history, wastage, pending job work" },
];

function monthRange(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

export default async function ProductionDashboardPage() {
  await requireActiveSubscription();
  const db = await getTenantDb();
  const { start, end } = monthRange();

  const [
    runsInProgress,
    finishedOutputAgg,
    yieldAgg,
    wastageAgg,
    inputAgg,
    pendingJobWorkCount,
  ] = await Promise.all([
    db.productionRun.count({ where: { status: "IN_PROGRESS" } }),
    db.productionOutput.aggregate({
      where: { outputType: "FINISHED", run: { completedAt: { gte: start, lte: end } } },
      _sum: { qty: true },
    }),
    db.productionRun.aggregate({
      where: { status: "COMPLETED", completedAt: { gte: start, lte: end }, yieldPercent: { not: null } },
      _avg: { yieldPercent: true },
    }),
    db.productionOutput.aggregate({
      where: { outputType: "WASTAGE", run: { completedAt: { gte: start, lte: end } } },
      _sum: { qty: true },
    }),
    db.productionInput.aggregate({
      where: { run: { completedAt: { gte: start, lte: end } } },
      _sum: { qty: true },
    }),
    db.jobWorkChallan.count({ where: { direction: "OUTWARD", status: { not: "CLOSED" } } }),
  ]);

  const totalInputQty = Number(inputAgg._sum.qty ?? 0);
  const totalWastageQty = Number(wastageAgg._sum.qty ?? 0);
  const wastagePercent = totalInputQty > 0 ? (totalWastageQty / totalInputQty) * 100 : null;

  const cards = [
    { label: "Runs in progress", value: runsInProgress, icon: ListChecks },
    { label: "This month's output", value: Number(finishedOutputAgg._sum.qty ?? 0).toFixed(2), icon: PackageCheck },
    {
      label: "Average yield",
      value: yieldAgg._avg.yieldPercent != null ? `${Number(yieldAgg._avg.yieldPercent).toFixed(1)}%` : "—",
      icon: Percent,
    },
    {
      label: "Wastage this month",
      value: wastagePercent != null ? `${wastagePercent.toFixed(1)}%` : "—",
      icon: TriangleAlert,
    },
    { label: "Pending job work", value: pendingJobWorkCount, icon: Truck },
  ];

  return (
    <div className="flex flex-col gap-6">
      <BackButton />
      <h1 className="text-2xl font-semibold">Production</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map((card) => (
          <div key={card.label} className="bg-card flex flex-col gap-1 rounded-xl border p-4 shadow-sm">
            <card.icon className="text-muted-foreground size-4" />
            <span className="text-xl font-semibold tabular-nums">{card.value}</span>
            <span className="text-muted-foreground text-xs">{card.label}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SECTIONS.map((section) => (
          <Link key={section.href} href={section.href}>
            <Card className="h-full transition-colors hover:bg-muted/50">
              <CardHeader>
                <CardTitle>{section.title}</CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
