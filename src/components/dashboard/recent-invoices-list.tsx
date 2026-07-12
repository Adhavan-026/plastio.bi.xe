import Link from "next/link";
import { cn } from "@/lib/utils";
import type { InvoiceStatusLabel } from "@/lib/billing/invoice-status";

type RecentInvoice = {
  id: string;
  invoiceNumber: string;
  partyName: string;
  invoiceDate: Date;
  totalAmount: number;
  status: InvoiceStatusLabel;
};

const STATUS_TONE: Record<InvoiceStatusLabel, string> = {
  Paid: "bg-primary/10 text-primary",
  Due: "bg-warning/10 text-warning",
  Overdue: "bg-destructive/10 text-destructive",
};

export function RecentInvoicesList({ invoices }: { invoices: RecentInvoice[] }) {
  return (
    <div className="bg-card rounded-xl border shadow-sm">
      <div className="flex items-center justify-between border-b px-5 py-3.5">
        <h2 className="text-sm font-bold">Recent Invoices</h2>
        <Link
          href="/dashboard/invoices"
          className="text-primary text-xs font-semibold hover:underline"
        >
          View All →
        </Link>
      </div>
      <ul className="flex flex-col divide-y">
        {invoices.length === 0 && (
          <li className="text-muted-foreground p-5 text-sm">No invoices yet.</li>
        )}
        {invoices.map((invoice) => (
          <li key={invoice.id}>
            <Link
              href={`/dashboard/invoices/${invoice.id}`}
              className="hover:bg-secondary/40 flex items-center justify-between gap-3 px-5 py-3 transition-colors"
            >
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-semibold">{invoice.partyName}</span>
                <span className="text-muted-foreground text-xs">
                  {invoice.invoiceNumber} &middot;{" "}
                  {invoice.invoiceDate.toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="text-sm font-bold tabular-nums">
                  ₹{invoice.totalAmount.toFixed(0)}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase",
                    STATUS_TONE[invoice.status]
                  )}
                >
                  {invoice.status}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
