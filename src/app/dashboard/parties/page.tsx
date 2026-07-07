import Link from "next/link";
import { getTenantDb } from "@/lib/tenant-db";
import { computeBalancesByParty } from "@/lib/billing/party-balance";
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

export default async function PartiesPage() {
  const db = await getTenantDb();
  const [parties, invoices] = await Promise.all([
    db.party.findMany({ orderBy: { createdAt: "desc" } }),
    db.invoice.findMany({
      where: { type: { not: "QUOTATION" } },
      select: { partyId: true, type: true, totalAmount: true, amountPaid: true },
    }),
  ]);

  const dueBalances = computeBalancesByParty(invoices);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Parties</h1>
        <Button render={<Link href="/dashboard/parties/new" />} nativeButton={false}>
          Add party
        </Button>
      </div>

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
                No parties yet.
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
                          ? "font-medium text-green-600"
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
    </div>
  );
}
