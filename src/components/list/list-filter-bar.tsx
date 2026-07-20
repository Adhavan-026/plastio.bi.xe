import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Search + optional status + optional date-range filter bar, submitted as
 * one GET form (URL search params drive the query, same pattern as
 * SearchBar/DateRangeForm) — no client JS needed for a plain filter+submit.
 */
export function ListFilterBar({
  searchPlaceholder,
  q,
  statusOptions,
  status,
  statusParamName = "status",
  statusLabel = "Status",
  showDateRange,
  from,
  to,
}: {
  searchPlaceholder?: string;
  q?: string;
  statusOptions?: { value: string; label: string }[];
  status?: string;
  /** URL search param + form field name for the status/category select — defaults to "status". */
  statusParamName?: string;
  statusLabel?: string;
  showDateRange?: boolean;
  from?: string;
  to?: string;
}) {
  return (
    <form method="GET" className="flex flex-wrap items-end gap-3">
      {searchPlaceholder && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="q">Search</Label>
          <Input id="q" name="q" defaultValue={q} placeholder={searchPlaceholder} className="w-full sm:w-56" />
        </div>
      )}
      {statusOptions && (
        <div className="flex flex-col gap-2">
          <Label htmlFor={statusParamName}>{statusLabel}</Label>
          <select
            id={statusParamName}
            name={statusParamName}
            defaultValue={status ?? ""}
            className="border-input h-8 rounded-lg border bg-transparent px-2.5 text-sm"
          >
            <option value="">All</option>
            {statusOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      )}
      {showDateRange && (
        <>
          <div className="flex flex-col gap-2">
            <Label htmlFor="from">From</Label>
            <Input id="from" name="from" type="date" defaultValue={from} className="w-40" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="to">To</Label>
            <Input id="to" name="to" type="date" defaultValue={to} className="w-40" />
          </div>
        </>
      )}
      <Button type="submit" variant="outline">
        Filter
      </Button>
    </form>
  );
}
