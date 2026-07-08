import Link from "next/link";
import { getTenantDb } from "@/lib/tenant-db";
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

export default async function InvoicesPage() {
  const db = await getTenantDb();
  const invoices = await db.invoice.findMany({
    where: { type: "SALES" },
    include: { party: { select: { name: true } } },
    orderBy: { invoiceDate: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Sales invoices</h1>
        <Button render={<Link href="/dashboard/invoices/new" />} nativeButton={false}>
          New invoice
        </Button>
      </div>

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
                No invoices yet.
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
    </div>
  );
}
