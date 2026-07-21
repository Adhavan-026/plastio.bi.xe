import Link from "next/link";
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
import { BomActiveToggle } from "./bom-active-toggle";

export default async function BomsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  await requireActiveSubscription();
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const page = resolvePage(params);

  const db = await getTenantDb();
  const where = {
    ...(q ? { name: ciContains(q) } : {}),
    ...(params.status === "active" ? { isActive: true } : {}),
    ...(params.status === "inactive" ? { isActive: false } : {}),
  };

  const [boms, count] = await Promise.all([
    db.bom.findMany({
      where,
      include: { outputProduct: { select: { name: true, unit: true } }, lines: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.bom.count({ where }),
  ]);
  const totalPages = computeTotalPages(count);

  return (
    <div className="flex flex-col gap-6">
      <BackButton />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Bills of Materials</h1>
        <Button render={<Link href="/dashboard/production/boms/new" />} nativeButton={false}>
          New BOM
        </Button>
      </div>

      <ListFilterBar
        searchPlaceholder="Search by BOM name..."
        q={q}
        status={params.status}
        statusOptions={[
          { value: "active", label: "Active" },
          { value: "inactive", label: "Inactive" },
        ]}
      />

      <div className="bg-card overflow-hidden rounded-xl border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Output item</TableHead>
              <TableHead className="text-right">Output qty</TableHead>
              <TableHead className="text-right">Inputs</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {boms.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground text-center">
                  {q ? `No BOMs match "${q}".` : "No BOMs yet."}
                </TableCell>
              </TableRow>
            )}
            {boms.map((bom) => (
              <TableRow key={bom.id}>
                <TableCell className="font-medium">
                  <Link href={`/dashboard/production/boms/${bom.id}/edit`} className="underline underline-offset-4">
                    {bom.name}
                  </Link>
                </TableCell>
                <TableCell>{bom.outputProduct.name}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {Number(bom.outputQty)} {bom.outputProduct.unit}
                </TableCell>
                <TableCell className="text-right tabular-nums">{bom.lines.length}</TableCell>
                <TableCell>
                  <Badge variant={bom.isActive ? "success" : "destructive"}>
                    {bom.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <BomActiveToggle bomId={bom.id} isActive={bom.isActive} />
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
