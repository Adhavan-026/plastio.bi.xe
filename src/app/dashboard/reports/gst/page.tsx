import { getTenantDb } from "@/lib/tenant-db";
import { resolveDateRange } from "@/lib/reports/date-range";
import { DateRangeForm } from "@/components/reports/date-range-form";
import { ExportCsvButton } from "@/components/reports/export-csv-button";
import { GstRateChart } from "@/components/reports/gst-rate-chart";
import { requireActiveSubscription } from "@/lib/billing/subscription";
import { BackButton } from "@/components/dashboard/back-button";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function GstReportPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  await requireActiveSubscription();
  const params = await searchParams;
  const { from, to, fromStr, toStr } = resolveDateRange(params);

  const db = await getTenantDb();
  const where = { invoice: { type: "SALES" as const, invoiceDate: { gte: from, lte: to } } };

  const [byRate, byHsn] = await Promise.all([
    db.invoiceItem.groupBy({
      by: ["gstRate"],
      where,
      _sum: { taxableAmount: true, cgstAmount: true, sgstAmount: true, igstAmount: true, totalAmount: true },
      orderBy: { gstRate: "asc" },
    }),
    db.invoiceItem.groupBy({
      by: ["hsnCode", "gstRate"],
      where: { ...where, hsnCode: { not: null } },
      _sum: { quantity: true, taxableAmount: true, cgstAmount: true, sgstAmount: true, igstAmount: true, totalAmount: true },
      orderBy: [{ hsnCode: "asc" }],
    }),
  ]);

  const rateRows = byRate.map((r) => ({
    rate: `${Number(r.gstRate)}%`,
    taxable: Number(r._sum.taxableAmount ?? 0),
    cgst: Number(r._sum.cgstAmount ?? 0),
    sgst: Number(r._sum.sgstAmount ?? 0),
    igst: Number(r._sum.igstAmount ?? 0),
    total: Number(r._sum.totalAmount ?? 0),
  }));

  const hsnRows = byHsn.map((r) => ({
    hsnCode: r.hsnCode ?? "—",
    rate: `${Number(r.gstRate)}%`,
    quantity: Number(r._sum.quantity ?? 0),
    taxable: Number(r._sum.taxableAmount ?? 0),
    cgst: Number(r._sum.cgstAmount ?? 0),
    sgst: Number(r._sum.sgstAmount ?? 0),
    igst: Number(r._sum.igstAmount ?? 0),
    total: Number(r._sum.totalAmount ?? 0),
  }));

  const grand = rateRows.reduce(
    (acc, r) => ({
      taxable: acc.taxable + r.taxable,
      cgst: acc.cgst + r.cgst,
      sgst: acc.sgst + r.sgst,
      igst: acc.igst + r.igst,
      total: acc.total + r.total,
    }),
    { taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 }
  );

  return (
    <div className="flex flex-col gap-8">
      <BackButton />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">GST summary</h1>
          <p className="text-muted-foreground text-sm">GSTR-1 style — sales only, rate-wise and HSN-wise.</p>
        </div>
      </div>

      <DateRangeForm from={fromStr} to={toStr} />

      <GstRateChart rows={rateRows} />

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-medium">Rate-wise summary</h2>
          <ExportCsvButton
            rows={rateRows}
            filename={`gst-rate-summary-${fromStr}-to-${toStr}.csv`}
            columns={[
              { key: "rate", label: "GST rate" },
              { key: "taxable", label: "Taxable value" },
              { key: "cgst", label: "CGST" },
              { key: "sgst", label: "SGST" },
              { key: "igst", label: "IGST" },
              { key: "total", label: "Total" },
            ]}
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>GST rate</TableHead>
              <TableHead className="text-right">Taxable value</TableHead>
              <TableHead className="text-right">CGST</TableHead>
              <TableHead className="text-right">SGST</TableHead>
              <TableHead className="text-right">IGST</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rateRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground text-center">
                  No sales in this range.
                </TableCell>
              </TableRow>
            )}
            {rateRows.map((row) => (
              <TableRow key={row.rate}>
                <TableCell>{row.rate}</TableCell>
                <TableCell className="text-right">₹{row.taxable.toFixed(2)}</TableCell>
                <TableCell className="text-right">₹{row.cgst.toFixed(2)}</TableCell>
                <TableCell className="text-right">₹{row.sgst.toFixed(2)}</TableCell>
                <TableCell className="text-right">₹{row.igst.toFixed(2)}</TableCell>
                <TableCell className="text-right">₹{row.total.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          {rateRows.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell className="font-medium">Total</TableCell>
                <TableCell className="text-right font-medium">₹{grand.taxable.toFixed(2)}</TableCell>
                <TableCell className="text-right font-medium">₹{grand.cgst.toFixed(2)}</TableCell>
                <TableCell className="text-right font-medium">₹{grand.sgst.toFixed(2)}</TableCell>
                <TableCell className="text-right font-medium">₹{grand.igst.toFixed(2)}</TableCell>
                <TableCell className="text-right font-medium">₹{grand.total.toFixed(2)}</TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-medium">HSN-wise summary</h2>
          <ExportCsvButton
            rows={hsnRows}
            filename={`gst-hsn-summary-${fromStr}-to-${toStr}.csv`}
            columns={[
              { key: "hsnCode", label: "HSN code" },
              { key: "rate", label: "GST rate" },
              { key: "quantity", label: "Quantity" },
              { key: "taxable", label: "Taxable value" },
              { key: "cgst", label: "CGST" },
              { key: "sgst", label: "SGST" },
              { key: "igst", label: "IGST" },
              { key: "total", label: "Total" },
            ]}
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>HSN code</TableHead>
              <TableHead>GST rate</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Taxable value</TableHead>
              <TableHead className="text-right">CGST</TableHead>
              <TableHead className="text-right">SGST</TableHead>
              <TableHead className="text-right">IGST</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {hsnRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-muted-foreground text-center">
                  No sales with HSN codes in this range.
                </TableCell>
              </TableRow>
            )}
            {hsnRows.map((row, i) => (
              <TableRow key={`${row.hsnCode}-${row.rate}-${i}`}>
                <TableCell>{row.hsnCode}</TableCell>
                <TableCell>{row.rate}</TableCell>
                <TableCell className="text-right">{row.quantity}</TableCell>
                <TableCell className="text-right">₹{row.taxable.toFixed(2)}</TableCell>
                <TableCell className="text-right">₹{row.cgst.toFixed(2)}</TableCell>
                <TableCell className="text-right">₹{row.sgst.toFixed(2)}</TableCell>
                <TableCell className="text-right">₹{row.igst.toFixed(2)}</TableCell>
                <TableCell className="text-right">₹{row.total.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
