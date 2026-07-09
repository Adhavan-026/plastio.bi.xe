"use client";

import { useActionState, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { createProducts } from "@/app/actions/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UNITS, VEHICLE_TYPES } from "@/lib/validations/product";

type ProductRow = {
  key: string;
  name: string;
  hsnCode: string;
  unit: string;
  category: string;
  gstRate: string;
  purchasePrice: string;
  sellingPrice: string;
  stockQty: string;
  lowStockAlert: string;
  tyreBrand: string;
  tyreSize: string;
  tyrePattern: string;
  tyreLoadIndex: string;
};

function emptyRow(): ProductRow {
  return {
    key: crypto.randomUUID(),
    name: "",
    hsnCode: "",
    unit: "PCS",
    category: "",
    gstRate: "0",
    purchasePrice: "0",
    sellingPrice: "0",
    stockQty: "0",
    lowStockAlert: "0",
    tyreBrand: "",
    tyreSize: "",
    tyrePattern: "",
    tyreLoadIndex: "",
  };
}

export function ProductBulkForm({ showTyreFields }: { showTyreFields?: boolean }) {
  const [state, formAction, pending] = useActionState(createProducts, undefined);
  // Starts empty — crypto.randomUUID() in emptyRow() must only ever run from a
  // client-triggered interaction, never as part of the initial render, or the
  // server and client would generate different ids and mismatch on hydration.
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [history, setHistory] = useState<ProductRow[][]>([]);

  function pushHistory() {
    setHistory((prev) => [...prev.slice(-9), rows]);
  }

  function updateRow(key: string, patch: Partial<ProductRow>) {
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  function addRow() {
    pushHistory();
    setRows((prev) => [...prev, emptyRow()]);
  }

  function removeRow(key: string) {
    pushHistory();
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.key !== key) : prev));
  }

  function undo() {
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setRows(last);
      return prev.slice(0, -1);
    });
  }

  const itemsJson = JSON.stringify(
    rows.map((row) => ({
      name: row.name,
      hsnCode: row.hsnCode,
      unit: row.unit,
      category: row.category,
      gstRate: row.gstRate,
      purchasePrice: row.purchasePrice,
      sellingPrice: row.sellingPrice,
      stockQty: row.stockQty,
      lowStockAlert: row.lowStockAlert,
      tyreBrand: row.tyreBrand,
      tyreSize: row.tyreSize,
      tyrePattern: row.tyrePattern,
      tyreLoadIndex: row.tyreLoadIndex,
    }))
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="itemsJson" value={itemsJson} />

      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          Add one or more products at once — each card below becomes a separate product.
        </p>
        <Button type="button" variant="outline" size="sm" onClick={undo} disabled={history.length === 0}>
          Undo
        </Button>
      </div>

      {rows.length === 0 && (
        <div className="bg-card text-muted-foreground rounded-xl border border-dashed p-8 text-center text-sm shadow-sm">
          No products yet — click &ldquo;Add product&rdquo; below to start.
        </div>
      )}

      {rows.map((row, index) => (
        <div key={row.key} className="bg-card flex flex-col gap-4 rounded-xl border p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold">Product {index + 1}</h2>
            {rows.length > 1 && (
              <button
                type="button"
                onClick={() => removeRow(row.key)}
                className="text-muted-foreground hover:text-destructive p-1"
                aria-label="Remove product"
              >
                <Trash2 className="size-4" />
              </button>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor={`name-${row.key}`}>Product name</Label>
            <Input
              id={`name-${row.key}`}
              value={row.name}
              onChange={(e) => updateRow(row.key, { name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor={`hsn-${row.key}`}>HSN code</Label>
              <Input
                id={`hsn-${row.key}`}
                value={row.hsnCode}
                onChange={(e) => updateRow(row.key, { hsnCode: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`unit-${row.key}`}>Unit</Label>
              <Select value={row.unit} onValueChange={(v) => updateRow(row.key, { unit: v as string })}>
                <SelectTrigger id={`unit-${row.key}`} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {showTyreFields ? (
              <>
                <Label htmlFor={`category-${row.key}`}>Vehicle type / Fit for</Label>
                <Select
                  value={row.category}
                  onValueChange={(v) => updateRow(row.key, { category: v as string })}
                >
                  <SelectTrigger id={`category-${row.key}`} className="w-full">
                    <SelectValue placeholder="Select vehicle type" />
                  </SelectTrigger>
                  <SelectContent>
                    {VEHICLE_TYPES.map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            ) : (
              <>
                <Label htmlFor={`category-${row.key}`}>Category</Label>
                <Input
                  id={`category-${row.key}`}
                  value={row.category}
                  onChange={(e) => updateRow(row.key, { category: e.target.value })}
                />
              </>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor={`gst-${row.key}`}>GST %</Label>
              <Input
                id={`gst-${row.key}`}
                type="number"
                step="0.01"
                value={row.gstRate}
                onChange={(e) => updateRow(row.key, { gstRate: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`purchase-${row.key}`}>Purchase price</Label>
              <Input
                id={`purchase-${row.key}`}
                type="number"
                step="0.01"
                value={row.purchasePrice}
                onChange={(e) => updateRow(row.key, { purchasePrice: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`selling-${row.key}`}>Selling price</Label>
              <Input
                id={`selling-${row.key}`}
                type="number"
                step="0.01"
                value={row.sellingPrice}
                onChange={(e) => updateRow(row.key, { sellingPrice: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor={`stock-${row.key}`}>Current stock</Label>
              <Input
                id={`stock-${row.key}`}
                type="number"
                step="0.001"
                value={row.stockQty}
                onChange={(e) => updateRow(row.key, { stockQty: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`low-stock-${row.key}`}>Low stock alert at</Label>
              <Input
                id={`low-stock-${row.key}`}
                type="number"
                step="0.001"
                value={row.lowStockAlert}
                onChange={(e) => updateRow(row.key, { lowStockAlert: e.target.value })}
              />
            </div>
          </div>

          {showTyreFields && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor={`brand-${row.key}`}>Tyre brand</Label>
                <Input
                  id={`brand-${row.key}`}
                  value={row.tyreBrand}
                  onChange={(e) => updateRow(row.key, { tyreBrand: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor={`size-${row.key}`}>Tyre size</Label>
                <Input
                  id={`size-${row.key}`}
                  placeholder="e.g. 145/80 R12"
                  value={row.tyreSize}
                  onChange={(e) => updateRow(row.key, { tyreSize: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor={`pattern-${row.key}`}>Tread pattern</Label>
                <Input
                  id={`pattern-${row.key}`}
                  value={row.tyrePattern}
                  onChange={(e) => updateRow(row.key, { tyrePattern: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor={`load-${row.key}`}>Load index</Label>
                <Input
                  id={`load-${row.key}`}
                  value={row.tyreLoadIndex}
                  onChange={(e) => updateRow(row.key, { tyreLoadIndex: e.target.value })}
                />
              </div>
            </div>
          )}
        </div>
      ))}

      <Button type="button" variant="outline" onClick={addRow} className="self-start">
        <Plus /> {rows.length === 0 ? "Add product" : "Add another product"}
      </Button>

      {state?.message && <p className="text-destructive text-sm">{state.message}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : `Create ${rows.length > 1 ? `${rows.length} products` : "product"}`}
        </Button>
      </div>
    </form>
  );
}
