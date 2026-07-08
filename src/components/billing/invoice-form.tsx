"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
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
import { EntityCombobox, type ComboboxOption } from "@/components/billing/entity-combobox";
import { QuickAddPartyDialog } from "@/components/billing/quick-add-party-dialog";
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
  stockQty: string;
};

type PartyOption = {
  id: string;
  name: string;
};

export type BatchOption = {
  id: string;
  batchNumber: string;
  expiryDate: string | null;
  quantity: string;
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
  batchId: string | null;
  tyreSerialNumber: string;
  warrantyMonths: string;
};

type Draft = {
  partyId: string | null;
  rows: Row[];
  billDiscountPercent: string;
  exchangeValue: string;
  vehicleNumber: string;
  vehicleType: string;
  notes: string;
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
    batchId: null,
    tyreSerialNumber: "",
    warrantyMonths: "",
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
  parties: initialParties,
  partyLabel,
  rateField,
  submitLabel,
  batchesByProduct,
  showTyreFields,
  draftKey,
}: {
  action: (state: SalesInvoiceFormState, formData: FormData) => Promise<SalesInvoiceFormState>;
  products: ProductOption[];
  parties: PartyOption[];
  partyLabel: string;
  rateField: "sellingPrice" | "purchasePrice";
  submitLabel: string;
  /** Agro module: batches (soonest-expiry first) available per productId. */
  batchesByProduct?: Record<string, BatchOption[]>;
  /** Tyre module: show vehicle info, exchange value, and per-line serial/warranty. */
  showTyreFields?: boolean;
  /** Distinguishes the localStorage draft between the sales and purchase screens. */
  draftKey: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [parties, setParties] = useState(initialParties);
  const [selectedPartyId, setSelectedPartyId] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([emptyRow()]);
  const [billDiscountPercent, setBillDiscountPercent] = useState("0");
  const [exchangeValue, setExchangeValue] = useState("0");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [notes, setNotes] = useState("");
  const [restoredDraft, setRestoredDraft] = useState(false);

  const storageKey = `invoice-draft-${draftKey}`;
  const hydrated = useRef(false);

  // Restore an in-progress draft on first mount (e.g. after a crashed tab).
  // localStorage only exists client-side, so this must run in an effect,
  // not a lazy useState initializer (which also runs during SSR).
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const draft: Draft = JSON.parse(saved);
        if (draft.rows?.length) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setSelectedPartyId(draft.partyId ?? null);
          setRows(draft.rows);
          setBillDiscountPercent(draft.billDiscountPercent ?? "0");
          setExchangeValue(draft.exchangeValue ?? "0");
          setVehicleNumber(draft.vehicleNumber ?? "");
          setVehicleType(draft.vehicleType ?? "");
          setNotes(draft.notes ?? "");
          setRestoredDraft(true);
        }
      } catch {
        localStorage.removeItem(storageKey);
      }
    }
    hydrated.current = true;
    // Only ever restore once, on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autosave after the initial restore pass, so we don't immediately overwrite
  // a draft with the form's blank initial state before restoration runs.
  useEffect(() => {
    if (!hydrated.current) return;
    const draft: Draft = {
      partyId: selectedPartyId,
      rows,
      billDiscountPercent,
      exchangeValue,
      vehicleNumber,
      vehicleType,
      notes,
    };
    localStorage.setItem(storageKey, JSON.stringify(draft));
  }, [selectedPartyId, rows, billDiscountPercent, exchangeValue, vehicleNumber, vehicleType, notes, storageKey]);

  function discardDraft() {
    localStorage.removeItem(storageKey);
    setSelectedPartyId(null);
    setRows([emptyRow()]);
    setBillDiscountPercent("0");
    setExchangeValue("0");
    setVehicleNumber("");
    setVehicleType("");
    setNotes("");
    setRestoredDraft(false);
  }

  const previewTotal = useMemo(() => {
    const gross = rows.reduce((sum, row) => sum + lineTotal(row), 0);
    const discount = Number(billDiscountPercent) || 0;
    const afterDiscount = gross - (gross * discount) / 100;
    return afterDiscount - (Number(exchangeValue) || 0);
  }, [rows, billDiscountPercent, exchangeValue]);

  const partyComboOptions: ComboboxOption[] = useMemo(
    () => parties.map((p) => ({ id: p.id, label: p.name })),
    [parties]
  );
  const selectedPartyOption = partyComboOptions.find((p) => p.id === selectedPartyId) ?? null;

  const productComboOptions: ComboboxOption[] = useMemo(
    () =>
      products.map((p) => ({
        id: p.id,
        label: p.name,
        sublabel: `${Number(p.stockQty)} ${p.unit} in stock · ₹${Number(
          rateField === "sellingPrice" ? p.sellingPrice : p.purchasePrice
        ).toFixed(2)}`,
      })),
    [products, rateField]
  );

  function updateRow(key: string, patch: Partial<Row>) {
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  function onProductPick(key: string, productId: string | null) {
    if (!productId) {
      updateRow(key, { productId: null, batchId: null });
      return;
    }
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    const batches = batchesByProduct?.[productId] ?? [];
    updateRow(key, {
      productId: product.id,
      description: product.name,
      unit: product.unit,
      rate: rateField === "sellingPrice" ? product.sellingPrice : product.purchasePrice,
      gstRate: product.gstRate,
      batchId: batches[0]?.id ?? null,
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
      batchId: row.batchId,
      tyreSerialNumber: row.tyreSerialNumber || null,
      warrantyMonths: row.warrantyMonths || null,
    }))
  );

  return (
    <form
      action={(formData) => {
        localStorage.removeItem(storageKey);
        return formAction(formData);
      }}
      className="flex flex-col gap-6"
    >
      <input type="hidden" name="itemsJson" value={itemsJson} />
      <input type="hidden" name="partyId" value={selectedPartyId ?? ""} />

      {restoredDraft && (
        <div className="flex items-center justify-between rounded-lg border border-warning/40 bg-warning/10 px-4 py-2 text-sm">
          <span>Restored an unsaved invoice draft.</span>
          <Button type="button" variant="ghost" size="sm" onClick={discardDraft}>
            <X /> Discard
          </Button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="partyId">{partyLabel}</Label>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <EntityCombobox
                items={partyComboOptions}
                value={selectedPartyOption}
                onValueChange={(item) => setSelectedPartyId(item?.id ?? null)}
                placeholder={`Search ${partyLabel.toLowerCase()}...`}
                emptyText={`No ${partyLabel.toLowerCase()} found.`}
              />
            </div>
            <QuickAddPartyDialog
              defaultType={partyLabel === "Customer" ? "CUSTOMER" : "SUPPLIER"}
              onCreated={(party) => {
                setParties((prev) => [...prev, party]);
                setSelectedPartyId(party.id);
              }}
            />
          </div>
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

      {showTyreFields && (
        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="vehicleNumber">Vehicle number</Label>
            <Input
              id="vehicleNumber"
              name="vehicleNumber"
              placeholder="e.g. TN09AB1234"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="vehicleType">Vehicle type</Label>
            <Input
              id="vehicleType"
              name="vehicleType"
              placeholder="e.g. Car, Bike, Truck"
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="exchangeValue">Old tyre exchange value</Label>
            <Input
              id="exchangeValue"
              name="exchangeValue"
              type="number"
              step="0.01"
              value={exchangeValue}
              onChange={(e) => setExchangeValue(e.target.value)}
            />
            {state?.errors?.exchangeValue && (
              <p className="text-sm text-destructive">{state.errors.exchangeValue[0]}</p>
            )}
          </div>
        </div>
      )}

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
                {batchesByProduct && <TableHead>Batch</TableHead>}
                {showTyreFields && <TableHead>Serial #</TableHead>}
                {showTyreFields && <TableHead className="w-24">Warranty (mo)</TableHead>}
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
              {rows.map((row) => {
                const rowBatches = row.productId ? (batchesByProduct?.[row.productId] ?? []) : [];
                const selectedProduct = row.productId ? products.find((p) => p.id === row.productId) : undefined;
                const availableStock = selectedProduct ? Number(selectedProduct.stockQty) : null;
                const overselling =
                  rateField === "sellingPrice" &&
                  availableStock !== null &&
                  Number(row.quantity) > availableStock;
                const selectedProductOption =
                  productComboOptions.find((p) => p.id === row.productId) ?? null;
                return (
                  <TableRow key={row.key}>
                    <TableCell>
                      <EntityCombobox
                        items={productComboOptions}
                        value={selectedProductOption}
                        onValueChange={(item) => onProductPick(row.key, item?.id ?? null)}
                        placeholder="Search or type custom..."
                        emptyText="No products found."
                        className="w-44"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={row.description}
                        onChange={(e) => updateRow(row.key, { description: e.target.value })}
                        className="min-w-40"
                      />
                    </TableCell>
                    {batchesByProduct && (
                      <TableCell>
                        {rowBatches.length > 0 ? (
                          <Select
                            value={row.batchId ?? ""}
                            onValueChange={(v) => updateRow(row.key, { batchId: v as string })}
                            items={Object.fromEntries(
                              rowBatches.map((b) => [
                                b.id,
                                `${b.batchNumber}${b.expiryDate ? ` (exp ${b.expiryDate})` : ""}`,
                              ])
                            )}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {rowBatches.map((b) => (
                                <SelectItem key={b.id} value={b.id}>
                                  {b.batchNumber}
                                  {b.expiryDate ? ` (exp ${b.expiryDate})` : ""}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                    )}
                    {showTyreFields && (
                      <TableCell>
                        <Input
                          value={row.tyreSerialNumber}
                          onChange={(e) => updateRow(row.key, { tyreSerialNumber: e.target.value })}
                          className="w-28"
                        />
                      </TableCell>
                    )}
                    {showTyreFields && (
                      <TableCell>
                        <Input
                          type="number"
                          value={row.warrantyMonths}
                          onChange={(e) => updateRow(row.key, { warrantyMonths: e.target.value })}
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      <Input
                        type="number"
                        step="0.001"
                        value={row.quantity}
                        onChange={(e) => updateRow(row.key, { quantity: e.target.value })}
                        aria-invalid={overselling}
                        className={overselling ? "border-destructive" : ""}
                      />
                      {overselling && (
                        <p className="text-destructive mt-1 text-xs whitespace-nowrap">
                          Only {availableStock} in stock
                        </p>
                      )}
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
                );
              })}
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
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
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
