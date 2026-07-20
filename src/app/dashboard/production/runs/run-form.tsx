"use client";

import { useActionState, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EntityCombobox, type ComboboxOption } from "@/components/billing/entity-combobox";
import { createProductionRun } from "@/app/actions/production-runs";

type ProductOption = { id: string; name: string; unit: string };
type BomOption = {
  id: string;
  name: string;
  outputQty: string;
  lines: { inputProductId: string; qty: string }[];
};

type LineRow = { key: string; productId: string | null; qty: string };

function emptyLine(): LineRow {
  return { key: crypto.randomUUID(), productId: null, qty: "" };
}

export function RunForm({ products, boms }: { products: ProductOption[]; boms: BomOption[] }) {
  const [state, formAction, pending] = useActionState(createProductionRun, undefined);

  const [bomId, setBomId] = useState<string | null>(null);
  const [batchSize, setBatchSize] = useState("");
  const [lines, setLines] = useState<LineRow[]>([emptyLine()]);

  const productOptions: ComboboxOption[] = products.map((p) => ({ id: p.id, label: `${p.name} (${p.unit})` }));
  const bomOptions: ComboboxOption[] = boms.map((b) => ({ id: b.id, label: b.name }));

  function applyBom(bom: BomOption | null, size: string) {
    if (!bom) return;
    const target = Number(size);
    const standard = Number(bom.outputQty);
    const scale = standard > 0 && target > 0 ? target / standard : 1;
    setLines(
      bom.lines.map((l) => ({
        key: crypto.randomUUID(),
        productId: l.inputProductId,
        qty: (Number(l.qty) * scale).toFixed(3),
      }))
    );
  }

  function updateLine(key: string, patch: Partial<LineRow>) {
    setLines((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }
  function removeLine(key: string) {
    setLines((rows) => (rows.length > 1 ? rows.filter((r) => r.key !== key) : rows));
  }

  const inputsJson = JSON.stringify(
    lines.filter((l) => l.productId).map((l) => ({ productId: l.productId, qty: l.qty }))
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="bomId" value={bomId ?? ""} />
      <input type="hidden" name="inputsJson" value={inputsJson} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label>BOM (optional)</Label>
          <EntityCombobox
            items={bomOptions}
            value={bomId ? (bomOptions.find((o) => o.id === bomId) ?? null) : null}
            onValueChange={(item) => {
              setBomId(item?.id ?? null);
              const bom = boms.find((b) => b.id === item?.id) ?? null;
              applyBom(bom, batchSize);
            }}
            placeholder="Ad-hoc run (no BOM)"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="batchSize">Batch size (output qty)</Label>
          <Input
            id="batchSize"
            type="number"
            step="0.001"
            min="0"
            value={batchSize}
            onChange={(e) => {
              setBatchSize(e.target.value);
              const bom = boms.find((b) => b.id === bomId) ?? null;
              applyBom(bom, e.target.value);
            }}
            placeholder="Pre-fills input lines from the BOM"
            disabled={!bomId}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="notes">Notes</Label>
          <Input id="notes" name="notes" placeholder="Optional" />
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
                <TableHead className="w-40">Qty</TableHead>
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
                      placeholder="Select a raw material"
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
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeLine(line.key)}>
                      <Trash2 className="text-destructive size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {state?.errors?.inputs && <p className="text-destructive text-sm">{state.errors.inputs[0]}</p>}
      </div>

      {state?.message && <p className="text-destructive text-sm">{state.message}</p>}

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Creating..." : "Create draft run"}
        </Button>
      </div>
    </form>
  );
}
