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

const STATUS_VARIANT: Record<string, "warning" | "secondary" | "success"> = {
  OPEN: "warning",
  PARTIALLY_RETURNED: "secondary",
  CLOSED: "success",
};

const STATUS_OPTIONS = [
  { value: "OPEN", label: "Open" },
  { value: "PARTIALLY_RETURNED", label: "Partially returned" },
  { value: "CLOSED", label: "Closed" },
];

export default async function JobWorkPage({
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
    direction: "OUTWARD" as const,
    ...(q
      ? {
          OR: [
            { challanNumber: ciContains(q) },
            { party: { name: ciContains(q) } },
          ],
        }
      : {}),
    ...(params.status ? { status: params.status } : {}),
    ...(params.from || params.to
      ? {
          date: {
            ...(params.from ? { gte: new Date(params.from) } : {}),
            ...(params.to ? { lte: new Date(`${params.to}T23:59:59.999`) } : {}),
          },
        }
      : {}),
  };

  const [challans, count] = await Promise.all([
    db.jobWorkChallan.findMany({
      where,
      include: { party: { select: { name: true } } },
      orderBy: { date: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.jobWorkChallan.count({ where }),
  ]);
  const totalPages = computeTotalPages(count);
  const today = new Date();

  return (
    <div className="flex flex-col gap-6">
      <BackButton />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Job work</h1>
        <Button render={<Link href="/dashboard/production/job-work/new" />} nativeButton={false}>
          New outward challan
        </Button>
      </div>

      <ListFilterBar
        searchPlaceholder="Search by challan # or job worker..."
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
              <TableHead>Challan #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Job worker</TableHead>
              <TableHead>Expected return</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {challans.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground text-center">
                  {q ? `No challans match "${q}".` : "No job work challans yet."}
                </TableCell>
              </TableRow>
            )}
            {challans.map((challan) => {
              const overdue =
                challan.status !== "CLOSED" && challan.expectedReturnDate && challan.expectedReturnDate < today;
              return (
                <TableRow key={challan.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/dashboard/production/job-work/${challan.id}`}
                      className="underline underline-offset-4"
                    >
                      {challan.challanNumber}
                    </Link>
                  </TableCell>
                  <TableCell>{challan.date.toLocaleDateString("en-IN")}</TableCell>
                  <TableCell>{challan.party.name}</TableCell>
                  <TableCell>
                    <span className={overdue ? "text-destructive flex items-center gap-1 font-medium" : ""}>
                      {overdue && <TriangleAlert className="size-3.5" />}
                      {challan.expectedReturnDate ? challan.expectedReturnDate.toLocaleDateString("en-IN") : "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[challan.status]}>{challan.status.replace("_", " ")}</Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <ListPagination page={page} totalPages={totalPages} searchParams={params} />
    </div>
  );
}
