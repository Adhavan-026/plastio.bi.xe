import Link from "next/link";
import { getTenantDb } from "@/lib/tenant-db";
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

const STATUS_VARIANT: Record<string, "success" | "warning" | "destructive"> = {
  PAID: "success",
  PARTIAL: "warning",
  UNPAID: "destructive",
};

export default async function PurchasesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const page = resolvePage(params);

  const db = await getTenantDb();

  const where = {
    type: "PURCHASE" as const,
    ...(q
      ? {
          OR: [
            { invoiceNumber: { contains: q, mode: "insensitive" as const } },
            { party: { name: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const [invoices, count] = await Promise.all([
    db.invoice.findMany({
      where,
      include: { party: { select: { name: true } } },
      orderBy: { invoiceDate: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.invoice.count({ where }),
  ]);
  const totalPages = computeTotalPages(count);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Purchase invoices</h1>
        <Button render={<Link href="/dashboard/purchases/new" />} nativeButton={false}>
          New purchase
        </Button>
      </div>

      <SearchBar placeholder="Search by invoice # or supplier..." defaultValue={q} />

      <div className="bg-card overflow-hidden rounded-xl border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground text-center">
                  {q ? `No purchases match "${q}".` : "No purchases yet."}
                </TableCell>
              </TableRow>
            )}
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium">
                  <Link href={`/dashboard/invoices/${invoice.id}`} className="underline underline-offset-4">
                    {invoice.invoiceNumber}
                  </Link>
                </TableCell>
                <TableCell>{invoice.invoiceDate.toLocaleDateString("en-IN")}</TableCell>
                <TableCell>{invoice.party.name}</TableCell>
                <TableCell className="text-right tabular-nums">
                  ₹{Number(invoice.totalAmount).toFixed(2)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  ₹{Number(invoice.amountPaid).toFixed(2)}
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[invoice.paymentStatus]}>{invoice.paymentStatus}</Badge>
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
