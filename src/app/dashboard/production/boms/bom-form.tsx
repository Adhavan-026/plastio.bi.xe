"use client";

import { useActionState, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EntityCombobox, type ComboboxOption } from "@/components/billing/entity-combobox";
import { createBom, updateBom } from "@/app/actions/boms";
import type { BomFormState } from "@/lib/validations/bom";

export type ProductOption = { id: string; name: string; unit: string };

type LineRow = { key: string; inputProductId: string | null; qty: string; wastagePercent: string };

function emptyLine(): LineRow {
  return { key: crypto.randomUUID(), inputProductId: null, qty: "", wastagePercent: "0" };
}

export function BomForm({
  products,
  bomId,
  defaultValues,
}: {
  products: ProductOption[];
  bomId?: string;
  defaultValues?: {
    name: string;
    outputProductId: string;
    outputQty: string;
    lines: { inputProductId: string; qty: string; wastagePercent: string }[];
  };
}) {
  const boundAction = bomId ? updateBom.bind(null, bomId) : createBom;
  const [state, formAction, pending] = useActionState<BomFormState, FormData>(boundAction, undefined);

  const [outputProductId, setOutputProductId] = useState<string | null>(defaultValues?.outputProductId ?? null);
  const [lines, setLines] = useState<LineRow[]>(
    defaultValues?.lines.length
      ? defaultValues.lines.map((l) => ({ key: crypto.randomUUID(), ...l }))
      : [emptyLine()]
  );

  const productOptions: ComboboxOption[] = products.map((p) => ({ id: p.id, label: `${p.name} (${p.unit})` }));

  function updateLine(key: string, patch: Partial<LineRow>) {
    setLines((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }
  function removeLine(key: string) {
    setLines((rows) => (rows.length > 1 ? rows.filter((r) => r.key !== key) : rows));
  }

  const linesJson = JSON.stringify(
    lines
      .filter((l) => l.inputProductId)
      .map((l) => ({ inputProductId: l.inputProductId, qty: l.qty, wastagePercent: l.wastagePercent || "0" }))
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="outputProductId" value={outputProductId ?? ""} />
      <input type="hidden" name="linesJson" value={linesJson} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">BOM name</Label>
          <Input id="name" name="name" defaultValue={defaultValues?.name} placeholder="e.g. Paddy to Rice v1" required />
          {state?.errors?.name && <p className="text-destructive text-sm">{state.errors.name[0]}</p>}
        </div>
        <div className="flex flex-col gap-2">
          <Label>Output item</Label>
          <EntityCombobox
            items={productOptions}
            value={outputProductId ? (productOptions.find((o) => o.id === outputProductId) ?? null) : null}
            onValueChange={(item) => setOutputProductId(item?.id ?? null)}
            placeholder="Select the finished item this BOM produces"
          />
          {state?.errors?.outputProductId && (
            <p className="text-destructive text-sm">{state.errors.outputProductId[0]}</p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="outputQty">Standard batch output qty</Label>
          <Input
            id="outputQty"
            name="outputQty"
            type="number"
            step="0.001"
            min="0"
            defaultValue={defaultValues?.outputQty}
            required
          />
          {state?.errors?.outputQty && <p className="text-destructive text-sm">{state.errors.outputQty[0]}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label>Input items</Label>
          <Button type="button" variant="outline" size="sm" onClick={() => setLines((r) => [...r, emptyLine()])}>
            <Plus className="size-4" /> Add input
          </Button>
        </div>
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="w-32">Qty</TableHead>
                <TableHead className="w-36">Wastage %</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((line) => (
                <TableRow key={line.key}>
                  <TableCell>
                    <EntityCombobox
                      items={productOptions}
                      value={line.inputProductId ? (productOptions.find((o) => o.id === line.inputProductId) ?? null) : null}
                      onValueChange={(item) => updateLine(line.key, { inputProductId: item?.id ?? null })}
                      placeholder="Select an input item"
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
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={line.wastagePercent}
                      onChange={(e) => updateLine(line.key, { wastagePercent: e.target.value })}
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

      {state?.message && <p className="text-destructive text-sm">{state.message}</p>}

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : bomId ? "Save changes" : "Create BOM"}
        </Button>
      </div>
    </form>
  );
}
