import Link from "next/link";
import { getTenantDb } from "@/lib/tenant-db";
import { computeBalancesByParty } from "@/lib/billing/party-balance";
import { PAGE_SIZE, resolvePage, totalPages as computeTotalPages } from "@/lib/pagination";
import { SearchBar } from "@/components/list/search-bar";
import { ListPagination } from "@/components/list/list-pagination";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function PartiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const page = resolvePage(params);

  const db = await getTenantDb();

  const where = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { phone: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [parties, count, invoices] = await Promise.all([
    db.party.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.party.count({ where }),
    db.invoice.findMany({
      where: { type: { not: "QUOTATION" } },
      select: { partyId: true, type: true, totalAmount: true, amountPaid: true },
    }),
  ]);

  const dueBalances = computeBalancesByParty(invoices);
  const totalPages = computeTotalPages(count);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Parties</h1>
        <Button render={<Link href="/dashboard/parties/new" />} nativeButton={false}>
          Add party
        </Button>
      </div>

      <SearchBar placeholder="Search by name or phone..." defaultValue={q} />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>State</TableHead>
            <TableHead className="text-right">Balance</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {parties.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-muted-foreground text-center">
                {q ? `No parties match "${q}".` : "No parties yet."}
              </TableCell>
            </TableRow>
          )}
          {parties.map((party) => {
            const balance = Number(party.openingBalance) + (dueBalances.get(party.id) ?? 0);
            return (
              <TableRow key={party.id}>
                <TableCell className="font-medium">
                  <Link href={`/dashboard/parties/${party.id}`} className="underline underline-offset-4">
                    {party.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{party.type}</Badge>
                </TableCell>
                <TableCell>{party.phone ?? "—"}</TableCell>
                <TableCell>{party.state ?? "—"}</TableCell>
                <TableCell className="text-right">
                  <span
                    className={
                      balance > 0
                        ? "text-destructive font-medium"
                        : balance < 0
                          ? "font-medium text-success"
                          : ""
                    }
                  >
                    ₹{Math.abs(balance).toFixed(2)} {balance > 0 ? "due" : balance < 0 ? "advance" : ""}
                  </span>
                </TableCell>
                <TableCell>
                  <Button
                    render={<Link href={`/dashboard/parties/${party.id}/edit`} />}
                    nativeButton={false}
                    variant="ghost"
                    size="sm"
                  >
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <ListPagination page={page} totalPages={totalPages} searchParams={params} />
    </div>
  );
}
