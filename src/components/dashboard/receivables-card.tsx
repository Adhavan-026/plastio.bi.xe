import Link from "next/link";
import { cn } from "@/lib/utils";
import type { AgingBucket } from "@/lib/billing/receivables-aging";

const BUCKET_TONE: Record<AgingBucket["key"], string> = {
  current: "bg-primary",
  "1-15": "bg-warning",
  "16-30": "bg-warning",
  "31-45": "bg-destructive",
  "45+": "bg-destructive",
};

function formatInr(v: number): string {
  return `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export function ReceivablesCard({ buckets }: { buckets: AgingBucket[] }) {
  const total = buckets.reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="bg-card rounded-xl border shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-3.5">
        <div>
          <h2 className="text-sm font-bold">Total Receivables</h2>
          <p className="text-muted-foreground text-xs">Outstanding balance across all customers</p>
        </div>
        <Link
          href="/dashboard/invoices?status=due"
          className="text-primary text-xs font-semibold hover:underline"
        >
          View All →
        </Link>
      </div>
      <div className="p-5">
        <div className="mb-5 text-3xl font-bold tabular-nums tracking-tight">{formatInr(total)}</div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {buckets.map((bucket) => (
            <div key={bucket.key} className="flex flex-col gap-1.5 rounded-lg border p-3">
              <span className={cn("h-1 w-6 rounded-full", BUCKET_TONE[bucket.key])} />
              <span className="text-sm font-bold tabular-nums">{formatInr(bucket.amount)}</span>
              <span className="text-muted-foreground text-xs">{bucket.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
