"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EntityCombobox, type ComboboxOption } from "@/components/billing/entity-combobox";
import { OUTPUT_TYPES } from "@/lib/validations/production-run";
import { completeProductionRunAction } from "@/app/actions/production-runs";

type ProductOption = { id: string; name: string; unit: string };
type OutputRow = { key: string; productId: string | null; qty: string; outputType: string };

function emptyRow(defaultProductId: string | null = null): OutputRow {
  return { key: crypto.randomUUID(), productId: defaultProductId, qty: "", outputType: "FINISHED" };
}

export function CompleteRunForm({
  runId,
  products,
  suggestedOutputProductId,
}: {
  runId: string;
  products: ProductOption[];
  suggestedOutputProductId: string | null;
}) {
  const [state, formAction, pending] = useActionState(completeProductionRunAction, undefined);
  const [rows, setRows] = useState<OutputRow[]>([emptyRow(suggestedOutputProductId)]);

  useEffect(() => {
    if (state?.warning) toast.warning(state.warning);
  }, [state?.warning]);

  const productOptions: ComboboxOption[] = products.map((p) => ({ id: p.id, label: `${p.name} (${p.unit})` }));

  function updateRow(key: string, patch: Partial<OutputRow>) {
    setRows((r) => r.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }
  function removeRow(key: string) {
    setRows((r) => (r.length > 1 ? r.filter((row) => row.key !== key) : r));
  }

  const outputsJson = JSON.stringify(
    rows
      .filter((r) => r.productId)
      .map((r) => ({ productId: r.productId, qty: r.qty, outputType: r.outputType }))
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="runId" value={runId} />
      <input type="hidden" name="outputsJson" value={outputsJson} />

      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead className="w-36">Qty</TableHead>
              <TableHead className="w-40">Type</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.key}>
                <TableCell>
                  <EntityCombobox
                    items={productOptions}
                    value={row.productId ? (productOptions.find((o) => o.id === row.productId) ?? null) : null}
                    onValueChange={(item) => updateRow(row.key, { productId: item?.id ?? null })}
                    placeholder="Select an output item"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="0.001"
                    min="0"
                    value={row.qty}
                    onChange={(e) => updateRow(row.key, { qty: e.target.value })}
                  />
                </TableCell>
                <TableCell>
                  <Select value={row.outputType} onValueChange={(v) => updateRow(row.key, { outputType: v as string })}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OUTPUT_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t.charAt(0) + t.slice(1).toLowerCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeRow(row.key)}>
                    <Trash2 className="text-destructive size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => setRows((r) => [...r, emptyRow()])}>
        <Plus className="size-4" /> Add output line
      </Button>

      {state?.message && <p className="text-destructive text-sm">{state.message}</p>}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Completing..." : "Complete run"}
        </Button>
      </div>
    </form>
  );
}
