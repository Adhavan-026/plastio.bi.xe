import Link from "next/link";
import { getTenantDb } from "@/lib/tenant-db";
import { getWarrantyExpiry, isWarrantyValid } from "@/lib/billing/warranty";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function WarrantyLookupPage({
  searchParams,
}: {
  searchParams: Promise<{ serial?: string }>;
}) {
  const { serial } = await searchParams;
  const db = await getTenantDb();

  const results = serial
    ? await db.invoiceItem.findMany({
        where: { tyreSerialNumber: { contains: serial, mode: "insensitive" } },
        include: { invoice: { include: { party: true } } },
        orderBy: { invoice: { invoiceDate: "desc" } },
      })
    : [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Warranty lookup</h1>
        <p className="text-muted-foreground text-sm">
          Search by the tyre&apos;s serial number to check sale date and warranty status.
        </p>
      </div>

      <form method="GET" className="flex items-end gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="serial">Serial number</Label>
          <Input id="serial" name="serial" defaultValue={serial ?? ""} className="w-64" />
        </div>
        <Button type="submit">Search</Button>
      </form>

      {serial && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Date sold</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Serial #</TableHead>
              <TableHead>Warranty until</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground text-center">
                  No sale found with that serial number.
                </TableCell>
              </TableRow>
            )}
            {results.map((item) => {
              const valid = isWarrantyValid(item.invoice.invoiceDate, item.warrantyMonths);
              const expiry = item.warrantyMonths
                ? getWarrantyExpiry(item.invoice.invoiceDate, item.warrantyMonths)
                : null;
              return (
                <TableRow key={item.id}>
                  <TableCell>
                    <Link
                      href={`/dashboard/invoices/${item.invoice.id}`}
                      className="underline underline-offset-4"
                    >
                      {item.invoice.invoiceNumber}
                    </Link>
                  </TableCell>
                  <TableCell>{item.invoice.invoiceDate.toLocaleDateString("en-IN")}</TableCell>
                  <TableCell>{item.invoice.party.name}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>{item.tyreSerialNumber}</TableCell>
                  <TableCell>{expiry ? expiry.toLocaleDateString("en-IN") : "—"}</TableCell>
                  <TableCell>
                    {item.warrantyMonths ? (
                      <Badge variant={valid ? "default" : "destructive"}>
                        {valid ? "Under warranty" : "Expired"}
                      </Badge>
                    ) : (
                      <Badge variant="secondary">No warranty recorded</Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
