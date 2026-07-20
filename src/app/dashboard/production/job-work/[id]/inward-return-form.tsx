"use client";

import { useActionState, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EntityCombobox, type ComboboxOption } from "@/components/billing/entity-combobox";
import { createInwardReturn } from "@/app/actions/job-work-challans";

type ProductOption = { id: string; name: string; unit: string };
type LineRow = { key: string; productId: string | null; qty: string; description: string };

function emptyLine(): LineRow {
  return { key: crypto.randomUUID(), productId: null, qty: "", description: "" };
}

export function InwardReturnForm({ outwardChallanId, products }: { outwardChallanId: string; products: ProductOption[] }) {
  const [state, formAction, pending] = useActionState(createInwardReturn, undefined);
  const [lines, setLines] = useState<LineRow[]>([emptyLine()]);

  const productOptions: ComboboxOption[] = products.map((p) => ({ id: p.id, label: `${p.name} (${p.unit})` }));
  const today = new Date().toISOString().slice(0, 10);

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

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="linkedChallanId" value={outwardChallanId} />
      <input type="hidden" name="linesJson" value={linesJson} />

      <div className="flex flex-col gap-2 sm:w-48">
        <Label htmlFor="returnDate">Return date</Label>
        <Input id="returnDate" name="date" type="date" defaultValue={today} required />
      </div>

      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item received</TableHead>
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
                    placeholder="May differ from what was sent"
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
      <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => setLines((r) => [...r, emptyLine()])}>
        <Plus className="size-4" /> Add item
      </Button>

      <div className="flex flex-col gap-2">
        <Label htmlFor="returnNotes">Notes</Label>
        <Input id="returnNotes" name="notes" placeholder="Optional" />
      </div>

      {state?.message && <p className="text-destructive text-sm">{state.message}</p>}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Recording..." : "Record return"}
        </Button>
      </div>
    </form>
  );
}
