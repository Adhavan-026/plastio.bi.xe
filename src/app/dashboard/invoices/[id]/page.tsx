import { notFound } from "next/navigation";
import { getTenantContext, getTenantDb } from "@/lib/tenant-db";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PrintButton } from "./print-button";
import { RecordPaymentForm } from "./record-payment-form";

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { tenantId } = await getTenantContext();
  const db = await getTenantDb();

  const [tenant, invoice] = await Promise.all([
    prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } }),
    db.invoice.findUnique({
      where: { id },
      include: { party: true, items: true, payments: { orderBy: { paymentDate: "asc" } } },
    }),
  ]);

  if (!invoice) notFound();

  const balanceDue = Number(invoice.totalAmount) - Number(invoice.amountPaid);
  const isInterState = Number(invoice.igstAmount) > 0;
  const isPurchase = invoice.type === "PURCHASE";
  const docTitle = isPurchase ? "PURCHASE BILL" : "TAX INVOICE";
  const partyLabel = isPurchase ? "Bill from" : "Bill to";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end print:hidden">
        <PrintButton />
      </div>

      <div className="mx-auto w-full max-w-3xl border p-8 print:border-none print:p-0">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold">{tenant.name}</h1>
            {tenant.address && <p className="text-sm">{tenant.address}</p>}
            <p className="text-sm">
              {[tenant.state, tenant.phone].filter(Boolean).join(" · ")}
            </p>
            {tenant.gstNumber && <p className="text-sm">GSTIN: {tenant.gstNumber}</p>}
          </div>
          <div className="text-right">
            <h2 className="text-lg font-semibold">{docTitle}</h2>
            <p className="text-sm">
              <span className="text-muted-foreground">No: </span>
              {invoice.invoiceNumber}
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">Date: </span>
              {invoice.invoiceDate.toLocaleDateString("en-IN")}
            </p>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="flex items-start justify-between">
          <div>
            <p className="text-muted-foreground text-xs uppercase">{partyLabel}</p>
            <p className="font-medium">{invoice.party.name}</p>
            {invoice.party.address && <p className="text-sm">{invoice.party.address}</p>}
            <p className="text-sm">
              {[invoice.party.state, invoice.party.phone].filter(Boolean).join(" · ")}
            </p>
            {invoice.party.gstNumber && <p className="text-sm">GSTIN: {invoice.party.gstNumber}</p>}
          </div>
          <Badge variant={invoice.paymentStatus === "PAID" ? "default" : invoice.paymentStatus === "PARTIAL" ? "secondary" : "destructive"}>
            {invoice.paymentStatus}
          </Badge>
        </div>

        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-1">#</th>
              <th className="py-1">Item</th>
              <th className="py-1">HSN</th>
              <th className="py-1 text-right">Qty</th>
              <th className="py-1 text-right">Rate</th>
              <th className="py-1 text-right">Disc</th>
              <th className="py-1 text-right">Taxable</th>
              {isInterState ? (
                <th className="py-1 text-right">IGST</th>
              ) : (
                <>
                  <th className="py-1 text-right">CGST</th>
                  <th className="py-1 text-right">SGST</th>
                </>
              )}
              <th className="py-1 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, i) => (
              <tr key={item.id} className="border-b">
                <td className="py-1">{i + 1}</td>
                <td className="py-1">{item.description}</td>
                <td className="py-1">{item.hsnCode ?? "—"}</td>
                <td className="py-1 text-right">
                  {Number(item.quantity)} {item.unit}
                </td>
                <td className="py-1 text-right">₹{Number(item.rate).toFixed(2)}</td>
                <td className="py-1 text-right">₹{Number(item.discountAmount).toFixed(2)}</td>
                <td className="py-1 text-right">₹{Number(item.taxableAmount).toFixed(2)}</td>
                {isInterState ? (
                  <td className="py-1 text-right">₹{Number(item.igstAmount).toFixed(2)}</td>
                ) : (
                  <>
                    <td className="py-1 text-right">₹{Number(item.cgstAmount).toFixed(2)}</td>
                    <td className="py-1 text-right">₹{Number(item.sgstAmount).toFixed(2)}</td>
                  </>
                )}
                <td className="py-1 text-right">₹{Number(item.totalAmount).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 ml-auto flex w-64 flex-col gap-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>₹{Number(invoice.subtotal).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Discount</span>
            <span>−₹{Number(invoice.discountAmount).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Taxable amount</span>
            <span>₹{Number(invoice.taxableAmount).toFixed(2)}</span>
          </div>
          {isInterState ? (
            <div className="flex justify-between">
              <span className="text-muted-foreground">IGST</span>
              <span>₹{Number(invoice.igstAmount).toFixed(2)}</span>
            </div>
          ) : (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">CGST</span>
                <span>₹{Number(invoice.cgstAmount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">SGST</span>
                <span>₹{Number(invoice.sgstAmount).toFixed(2)}</span>
              </div>
            </>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Round off</span>
            <span>₹{Number(invoice.roundOff).toFixed(2)}</span>
          </div>
          <Separator className="my-1" />
          <div className="flex justify-between text-base font-semibold">
            <span>Total</span>
            <span>₹{Number(invoice.totalAmount).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Paid</span>
            <span>₹{Number(invoice.amountPaid).toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Balance due</span>
            <span>₹{balanceDue.toFixed(2)}</span>
          </div>
        </div>

        {invoice.notes && (
          <div className="mt-6 text-sm">
            <p className="text-muted-foreground text-xs uppercase">Notes</p>
            <p>{invoice.notes}</p>
          </div>
        )}
      </div>

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 print:hidden">
        <Separator />

        <div>
          <h3 className="mb-2 font-medium">Payments</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.payments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground text-center">
                    No payments recorded yet.
                  </TableCell>
                </TableRow>
              )}
              {invoice.payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{payment.paymentDate.toLocaleDateString("en-IN")}</TableCell>
                  <TableCell>{payment.mode}</TableCell>
                  <TableCell>{payment.reference ?? "—"}</TableCell>
                  <TableCell className="text-right">₹{Number(payment.amount).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {balanceDue > 0 && <RecordPaymentForm invoiceId={invoice.id} balanceDue={balanceDue} />}
      </div>
    </div>
  );
}
