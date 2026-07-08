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

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const page = resolvePage(params);

  const db = await getTenantDb();

  const where = {
    type: "SALES" as const,
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
        <h1 className="text-2xl font-semibold">Sales invoices</h1>
        <Button render={<Link href="/dashboard/invoices/new" />} nativeButton={false}>
          New invoice
        </Button>
      </div>

      <SearchBar placeholder="Search by invoice # or customer..." defaultValue={q} />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice #</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-right">Paid</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-muted-foreground text-center">
                {q ? `No invoices match "${q}".` : "No invoices yet."}
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
              <TableCell className="text-right">₹{Number(invoice.totalAmount).toFixed(2)}</TableCell>
              <TableCell className="text-right">₹{Number(invoice.amountPaid).toFixed(2)}</TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANT[invoice.paymentStatus]}>{invoice.paymentStatus}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <ListPagination page={page} totalPages={totalPages} searchParams={params} />
    </div>
  );
}
