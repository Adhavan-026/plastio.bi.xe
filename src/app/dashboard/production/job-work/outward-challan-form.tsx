"use client";

import { useActionState, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EntityCombobox, type ComboboxOption } from "@/components/billing/entity-combobox";
import { createOutwardChallan } from "@/app/actions/job-work-challans";

type ProductOption = { id: string; name: string; unit: string };
type PartyOption = { id: string; name: string };

type LineRow = { key: string; productId: string | null; qty: string; description: string };

function emptyLine(): LineRow {
  return { key: crypto.randomUUID(), productId: null, qty: "", description: "" };
}

export function OutwardChallanForm({ products, jobWorkers }: { products: ProductOption[]; jobWorkers: PartyOption[] }) {
  const [state, formAction, pending] = useActionState(createOutwardChallan, undefined);
  const [partyId, setPartyId] = useState<string | null>(null);
  const [lines, setLines] = useState<LineRow[]>([emptyLine()]);

  const productOptions: ComboboxOption[] = products.map((p) => ({ id: p.id, label: `${p.name} (${p.unit})` }));
  const partyOptions: ComboboxOption[] = jobWorkers.map((p) => ({ id: p.id, label: p.name }));

  function updateLine(key: string, patch: Partial<LineRow>) {
    setLines((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }
  function removeLine(key: string) {
    setLines((rows) => (rows.length > 1 ? rows.filter((r) => r.key !== key) : rows));
  }

  const linesJson = JSON.stringify(
    lines
      .filter((l) => l.productId)
      .map((l) => ({ productId: l.productId, qty: l.qty, description: l.description || undefined }))
  );

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="partyId" value={partyId ?? ""} />
      <input type="hidden" name="linesJson" value={linesJson} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label>Job worker</Label>
          <EntityCombobox
            items={partyOptions}
            value={partyId ? (partyOptions.find((o) => o.id === partyId) ?? null) : null}
            onValueChange={(item) => setPartyId(item?.id ?? null)}
            placeholder="Select a job worker"
            emptyText="No parties marked as a job worker — mark one in Parties first."
          />
          {state?.errors?.partyId && <p className="text-destructive text-sm">{state.errors.partyId[0]}</p>}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="date">Date</Label>
          <Input id="date" name="date" type="date" defaultValue={today} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="expectedReturnDate">Expected return date</Label>
          <Input id="expectedReturnDate" name="expectedReturnDate" type="date" />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label>Items sent</Label>
          <Button type="button" variant="outline" size="sm" onClick={() => setLines((r) => [...r, emptyLine()])}>
            <Plus className="size-4" /> Add item
          </Button>
        </div>
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="w-32">Qty</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((line) => (
                <TableRow key={line.key}>
                  <TableCell>
                    <EntityCombobox
                      items={productOptions}
                      value={line.productId ? (productOptions.find((o) => o.id === line.productId) ?? null) : null}
                      onValueChange={(item) => updateLine(line.key, { productId: item?.id ?? null })}
                      placeholder="Select an item"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.001"
                      min="0"
                      value={line.qty}
                      onChange={(e) => updateLine(line.key, { qty: e.target.value })}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={line.description}
                      onChange={(e) => updateLine(line.key, { description: e.target.value })}
                      placeholder="Optional"
                    />
                  </TableCell>
                  <TableCell>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeLine(line.key)}>
                      <Trash2 className="text-destructive size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {state?.errors?.lines && <p className="text-destructive text-sm">{state.errors.lines[0]}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="notes">Notes</Label>
        <Input id="notes" name="notes" placeholder="Optional" />
      </div>

      {state?.message && <p className="text-destructive text-sm">{state.message}</p>}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Creating..." : "Create outward challan"}
        </Button>
      </div>
    </form>
  );
}
