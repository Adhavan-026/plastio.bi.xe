"use client";

import { useActionState, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UNITS } from "@/lib/validations/product";
import { PAYMENT_MODES } from "@/lib/validations/invoice";
import type { SalesInvoiceFormState } from "@/lib/validations/invoice";

type ProductOption = {
  id: string;
  name: string;
  unit: string;
  gstRate: string;
  sellingPrice: string;
  purchasePrice: string;
};

type PartyOption = {
  id: string;
  name: string;
};

type Row = {
  key: string;
  productId: string | null;
  description: string;
  quantity: string;
  unit: string;
  rate: string;
  discountPercent: string;
  gstRate: string;
};

function emptyRow(): Row {
  return {
    key: crypto.randomUUID(),
    productId: null,
    description: "",
    quantity: "1",
    unit: "PCS",
    rate: "0",
    discountPercent: "0",
    gstRate: "0",
  };
}

function lineTotal(row: Row): number {
  const qty = Number(row.quantity) || 0;
  const rate = Number(row.rate) || 0;
  const discountPercent = Number(row.discountPercent) || 0;
  const gstRate = Number(row.gstRate) || 0;
  const gross = qty * rate;
  const afterDiscount = gross - (gross * discountPercent) / 100;
  return afterDiscount + (afterDiscount * gstRate) / 100;
}

export function InvoiceForm({
  action,
  products,
  parties,
  partyLabel,
  rateField,
  submitLabel,
}: {
  action: (state: SalesInvoiceFormState, formData: FormData) => Promise<SalesInvoiceFormState>;
  products: ProductOption[];
  parties: PartyOption[];
  partyLabel: string;
  rateField: "sellingPrice" | "purchasePrice";
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [rows, setRows] = useState<Row[]>([emptyRow()]);
  const [billDiscountPercent, setBillDiscountPercent] = useState("0");

  const previewTotal = useMemo(() => {
    const gross = rows.reduce((sum, row) => sum + lineTotal(row), 0);
    const discount = Number(billDiscountPercent) || 0;
    return gross - (gross * discount) / 100;
  }, [rows, billDiscountPercent]);

  const productItems = useMemo(
    () => ({
      custom: "Custom item",
      ...Object.fromEntries(products.map((p) => [p.id, p.name])),
    }),
    [products]
  );

  const partyItems = useMemo(
    () => Object.fromEntries(parties.map((party) => [party.id, party.name])),
    [parties]
  );

  function updateRow(key: string, patch: Partial<Row>) {
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  function onProductPick(key: string, productId: string) {
    if (productId === "custom") {
      updateRow(key, { productId: null });
      return;
    }
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    updateRow(key, {
      productId: product.id,
      description: product.name,
      unit: product.unit,
      rate: rateField === "sellingPrice" ? product.sellingPrice : product.purchasePrice,
      gstRate: product.gstRate,
    });
  }

  const itemsJson = JSON.stringify(
    rows.map((row) => ({
      productId: row.productId,
      description: row.description,
      quantity: row.quantity,
      unit: row.unit,
      rate: row.rate,
      discountPercent: row.discountPercent,
      gstRate: row.gstRate,
    }))
  );

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="itemsJson" value={itemsJson} />

      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="partyId">{partyLabel}</Label>
          <Select name="partyId" items={partyItems}>
            <SelectTrigger id="partyId" className="w-full">
              <SelectValue placeholder={`Select ${partyLabel.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {parties.map((party) => (
                <SelectItem key={party.id} value={party.id}>
                  {party.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {state?.errors?.partyId && (
            <p className="text-sm text-destructive">{state.errors.partyId[0]}</p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="invoiceDate">Invoice date</Label>
          <Input
            id="invoiceDate"
            name="invoiceDate"
            type="date"
            defaultValue={new Date().toISOString().slice(0, 10)}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="billDiscountPercent">Bill discount %</Label>
          <Input
            id="billDiscountPercent"
            name="billDiscountPercent"
            type="number"
            step="0.01"
            value={billDiscountPercent}
            onChange={(e) => setBillDiscountPercent(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Items</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={() => setRows((prev) => [...prev, emptyRow()])}>
            Add item
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-20">Qty</TableHead>
                <TableHead className="w-24">Unit</TableHead>
                <TableHead className="w-24">Rate</TableHead>
                <TableHead className="w-20">Disc %</TableHead>
                <TableHead className="w-20">GST %</TableHead>
                <TableHead className="w-24 text-right">Line total</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.key}>
                  <TableCell>
                    <Select
                      value={row.productId ?? "custom"}
                      onValueChange={(v) => onProductPick(row.key, v as string)}
                      items={productItems}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="custom">Custom item</SelectItem>
                        {products.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      value={row.description}
                      onChange={(e) => updateRow(row.key, { description: e.target.value })}
                      className="min-w-40"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.001"
                      value={row.quantity}
                      onChange={(e) => updateRow(row.key, { quantity: e.target.value })}
                    />
                  </TableCell>
                  <TableCell>
                    <Select value={row.unit} onValueChange={(v) => updateRow(row.key, { unit: v as string })}>
                      <SelectTrigger className="w-full">
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
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      value={row.rate}
                      onChange={(e) => updateRow(row.key, { rate: e.target.value })}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      value={row.discountPercent}
                      onChange={(e) => updateRow(row.key, { discountPercent: e.target.value })}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      value={row.gstRate}
                      onChange={(e) => updateRow(row.key, { gstRate: e.target.value })}
                    />
                  </TableCell>
                  <TableCell className="text-right">₹{lineTotal(row).toFixed(2)}</TableCell>
                  <TableCell>
                    {rows.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setRows((prev) => prev.filter((r) => r.key !== row.key))}
                      >
                        Remove
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {state?.errors?.itemsJson && (
            <p className="mt-2 text-sm text-destructive">{state.errors.itemsJson[0]}</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="amountPaid">Amount paid now</Label>
          <Input id="amountPaid" name="amountPaid" type="number" step="0.01" defaultValue="0" />
          {state?.errors?.amountPaid && (
            <p className="text-sm text-destructive">{state.errors.amountPaid[0]}</p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="paymentMode">Payment mode</Label>
          <Select name="paymentMode" defaultValue="CASH">
            <SelectTrigger id="paymentMode" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_MODES.map((mode) => (
                <SelectItem key={mode} value={mode}>
                  {mode}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col justify-end gap-1 text-right">
          <p className="text-muted-foreground text-sm">Estimated total (server recalculates exactly)</p>
          <p className="text-2xl font-semibold">₹{previewTotal.toFixed(2)}</p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="notes">Notes</Label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          className="border-input dark:bg-input/30 rounded-lg border bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      {state?.message && <p className="text-sm text-destructive">{state.message}</p>}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving invoice..." : submitLabel}
      </Button>
    </form>
  );
}
