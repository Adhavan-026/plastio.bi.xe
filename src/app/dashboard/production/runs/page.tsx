import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { getTenantDb } from "@/lib/tenant-db";
import { requireActiveSubscription } from "@/lib/billing/subscription";
import { ciContains } from "@/lib/db-search";
import { PAGE_SIZE, resolvePage, totalPages as computeTotalPages } from "@/lib/pagination";
import { ListFilterBar } from "@/components/list/list-filter-bar";
import { ListPagination } from "@/components/list/list-pagination";
import { BackButton } from "@/components/dashboard/back-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const STATUS_VARIANT: Record<string, "secondary" | "warning" | "success" | "destructive"> = {
  DRAFT: "secondary",
  IN_PROGRESS: "warning",
  COMPLETED: "success",
  CANCELLED: "destructive",
};

const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Draft" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

export default async function ProductionRunsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; from?: string; to?: string; page?: string }>;
}) {
  await requireActiveSubscription();
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const page = resolvePage(params);

  const db = await getTenantDb();
  const where = {
    ...(q ? { runNumber: ciContains(q) } : {}),
    ...(params.status ? { status: params.status } : {}),
    ...(params.from || params.to
      ? {
          createdAt: {
            ...(params.from ? { gte: new Date(params.from) } : {}),
            ...(params.to ? { lte: new Date(`${params.to}T23:59:59.999`) } : {}),
          },
        }
      : {}),
  };

  const [runs, count] = await Promise.all([
    db.productionRun.findMany({
      where,
      include: { bom: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.productionRun.count({ where }),
  ]);
  const totalPages = computeTotalPages(count);

  return (
    <div className="flex flex-col gap-6">
      <BackButton />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Production runs</h1>
        <Button render={<Link href="/dashboard/production/runs/new" />} nativeButton={false}>
          New run
        </Button>
      </div>

      <ListFilterBar
        searchPlaceholder="Search by run #..."
        q={q}
        status={params.status}
        statusOptions={STATUS_OPTIONS}
        showDateRange
        from={params.from}
        to={params.to}
      />

      <div className="bg-card overflow-hidden rounded-xl border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Run #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>BOM</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Yield</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {runs.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground text-center">
                  {q ? `No runs match "${q}".` : "No production runs yet."}
                </TableCell>
              </TableRow>
            )}
            {runs.map((run) => (
              <TableRow key={run.id}>
                <TableCell className="font-medium">
                  <Link href={`/dashboard/production/runs/${run.id}`} className="underline underline-offset-4">
                    {run.runNumber}
                  </Link>
                </TableCell>
                <TableCell>{run.createdAt.toLocaleDateString("en-IN")}</TableCell>
                <TableCell>{run.bom?.name ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[run.status]}>{run.status.replace("_", " ")}</Badge>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {run.yieldPercent != null ? `${Number(run.yieldPercent).toFixed(1)}%` : "—"}
                </TableCell>
                <TableCell>
                  {run.wastageExceeded && (
                    <span title="Wastage exceeded the configured threshold">
                      <TriangleAlert className="text-destructive size-4" />
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ListPagination page={page} totalPages={totalPages} searchParams={params} />
    </div>
  );
}
