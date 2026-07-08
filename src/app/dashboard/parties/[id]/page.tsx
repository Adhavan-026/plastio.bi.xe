import Link from "next/link";
import { notFound } from "next/navigation";
import { getTenantDb } from "@/lib/tenant-db";
import { buildPartyLedger } from "@/lib/billing/party-ledger";
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

export default async function PartyStatementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await getTenantDb();

  const party = await db.party.findUnique({ where: { id } });
  if (!party) notFound();

  const [invoices, payments] = await Promise.all([
    db.invoice.findMany({
      where: { partyId: id, type: { not: "QUOTATION" } },
      select: { invoiceNumber: true, invoiceDate: true, type: true, totalAmount: true },
    }),
    db.payment.findMany({
      where: { partyId: id },
      select: { paymentDate: true, amount: true, mode: true, invoice: { select: { type: true } } },
    }),
  ]);

  const { entries, closingBalance } = buildPartyLedger(
    Number(party.openingBalance),
    invoices,
    payments
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{party.name}</h1>
          <p className="text-muted-foreground text-sm">
            {party.type} &middot; {[party.phone, party.state].filter(Boolean).join(" · ")}
          </p>
        </div>
        <Button render={<Link href={`/dashboard/parties/${party.id}/edit`} />} nativeButton={false} variant="outline">
          Edit party
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-muted-foreground text-sm">Current balance:</span>
        <Badge variant={closingBalance > 0 ? "destructive" : closingBalance < 0 ? "success" : "secondary"}>
          ₹{Math.abs(closingBalance).toFixed(2)} {closingBalance > 0 ? "due" : closingBalance < 0 ? "advance" : "settled"}
        </Badge>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Debit</TableHead>
            <TableHead className="text-right">Credit</TableHead>
            <TableHead className="text-right">Balance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell colSpan={4} className="text-muted-foreground">
              Opening balance
            </TableCell>
            <TableCell className="text-right">₹{Number(party.openingBalance).toFixed(2)}</TableCell>
          </TableRow>
          {entries.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-muted-foreground text-center">
                No transactions yet.
              </TableCell>
            </TableRow>
          )}
          {entries.map((entry, i) => (
            <TableRow key={i}>
              <TableCell>{entry.date.toLocaleDateString("en-IN")}</TableCell>
              <TableCell>{entry.description}</TableCell>
              <TableCell className="text-right">{entry.debit > 0 ? `₹${entry.debit.toFixed(2)}` : "—"}</TableCell>
              <TableCell className="text-right">{entry.credit > 0 ? `₹${entry.credit.toFixed(2)}` : "—"}</TableCell>
              <TableCell className="text-right">₹{entry.balance.toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
