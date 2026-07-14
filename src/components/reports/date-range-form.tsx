import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function DateRangeForm({ from, to }: { from: string; to: string }) {
  return (
    <>
      <form method="GET" className="flex flex-wrap items-end gap-3 print:hidden">
        <div className="flex flex-col gap-2">
          <Label htmlFor="from">From</Label>
          <Input id="from" name="from" type="date" defaultValue={from} className="w-40" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="to">To</Label>
          <Input id="to" name="to" type="date" defaultValue={to} className="w-40" />
        </div>
        <Button type="submit">Apply</Button>
      </form>
      <p className="hidden text-sm text-muted-foreground print:block">
        Period: {new Date(from).toLocaleDateString("en-IN")} to {new Date(to).toLocaleDateString("en-IN")}
      </p>
    </>
  );
}
