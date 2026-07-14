"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { X, Search, Minus, Plus, Trash2 } from "lucide-react";
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
import { QuickAddProductDialog } from "@/components/billing/quick-add-product-dialog";
import { UNITS, VEHICLE_TYPES } from "@/lib/validations/product";
import { PAYMENT_MODES } from "@/lib/validations/invoice";
import type { SalesInvoiceFormState } from "@/lib/validations/invoice";
import { updatePartyState } from "@/app/actions/parties";
import { INDIAN_STATES } from "@/lib/validations/states";

type ProductOption = {
  id: string;
  name: string;
  unit: string;
  gstRate: string;
  sellingPrice: string;
  purchasePrice: string;
  stockQty: string;
  /** Tyre module: the vehicle this product fits (repurposed "category"). */
  category?: string | null;
};

type PartyOption = {
  id: string;
  name: string;
  state: string | null;
};

export type BatchOption = {
  id: string;
  batchNumber: string;
  expiryDate: string | null;
  quantity: string;
};

export type Row = {
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
  paymentMode: string;
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

/** Client-side mirror of computeInvoiceTotals for a live preview only — the server (src/lib/billing/gst.ts) is authoritative. */
function computeTotals(rows: Row[], billDiscountPercent: string, isInterState: boolean) {
  const billDiscount = Number(billDiscountPercent) || 0;
  let subtotal = 0;
  let discountAmount = 0;
  let taxableAmount = 0;
  let gstAmount = 0;

  for (const row of rows) {
    const qty = Number(row.quantity) || 0;
    const rate = Number(row.rate) || 0;
    const gross = qty * rate;
    subtotal += gross;

    const itemDiscountPercent = Number(row.discountPercent) || 0;
    const itemDiscount = (gross * itemDiscountPercent) / 100;
    const afterItemDiscount = gross - itemDiscount;

    const billDiscountAmt = (afterItemDiscount * billDiscount) / 100;
    const taxable = afterItemDiscount - billDiscountAmt;
    discountAmount += itemDiscount + billDiscountAmt;
    taxableAmount += taxable;

    const gstRate = Number(row.gstRate) || 0;
    gstAmount += (taxable * gstRate) / 100;
  }

  return {
    subtotal,
    discountAmount,
    taxableAmount,
    cgstAmount: isInterState ? 0 : gstAmount / 2,
    sgstAmount: isInterState ? 0 : gstAmount / 2,
    igstAmount: isInterState ? gstAmount : 0,
  };
}

function isInterState(tenantState: string | null, partyState: string | null | undefined): boolean {
  if (!tenantState || !partyState) return false;
  return tenantState.trim().toLowerCase() !== partyState.trim().toLowerCase();
}

export function InvoiceForm({
  action,
  products: initialProducts,
  parties: initialParties,
  partyLabel,
  rateField,
  submitLabel,
  batchesByProduct,
  showTyreFields,
  isTyreTenant,
  draftKey,
  tenantState,
  invoiceNumberField,
  initialInvoice,
}: {
  action: (state: SalesInvoiceFormState, formData: FormData) => Promise<SalesInvoiceFormState>;
  products: ProductOption[];
  parties: PartyOption[];
  partyLabel: string;
  rateField: "sellingPrice" | "purchasePrice";
  submitLabel: string;
  /** Agro module: batches (soonest-expiry first) available per productId. */
  batchesByProduct?: Record<string, BatchOption[]>;
  /** Tyre module: show vehicle info, exchange value, and bigger item-entry fields (sales screen only). */
  showTyreFields?: boolean;
  /** Whether the tenant is a Tyre shop, independent of showTyreFields — a
   * product's vehicle-fit categorization applies on the purchase screen too,
   * which never sets showTyreFields. Falls back to showTyreFields if omitted. */
  isTyreTenant?: boolean;
  /** Distinguishes the localStorage draft between the sales and purchase screens. */
  draftKey: string;
  /** The shop's own state, for the live CGST/SGST vs IGST preview. */
  tenantState: string | null;
  /** Bill-number field. The placeholder previews the next auto number; when
   * the owner has enabled invoice editing (owners/managers), the sequence
   * becomes editable and future bills continue after a custom number. */
  invoiceNumberField?: {
    /** e.g. "SALES/2025-26/" — the fixed part shown before the sequence. */
    prefix: string;
    /** Next auto sequence (padded), shown as the placeholder. */
    placeholderSeq: string;
    /** Pre-filled sequence when editing an existing invoice. */
    defaultSeq?: string;
    editable: boolean;
  };
  /** Edit mode: pre-fills the form from an existing invoice, hides payment
   * capture (payments live separately), and disables draft autosave. Row
   * keys must be deterministic (built server-side) — SSR renders this too. */
  initialInvoice?: {
    partyId: string;
    invoiceDate: string;
    billDiscountPercent: string;
    exchangeValue: string;
    vehicleNumber: string;
    vehicleType: string;
    notes: string;
    rows: Row[];
  };
}) {
  const editMode = !!initialInvoice;
  const [state, formAction, pending] = useActionState(action, undefined);
  const [parties, setParties] = useState(initialParties);
  const [products, setProducts] = useState(initialProducts);
  const [selectedPartyId, setSelectedPartyId] = useState<string | null>(
    initialInvoice?.partyId ?? null
  );
  const [rows, setRows] = useState<Row[]>(initialInvoice?.rows ?? []);
  const [rowHistory, setRowHistory] = useState<Row[][]>([]);
  const [quickAddSelection, setQuickAddSelection] = useState<ComboboxOption | null>(null);
  const [billDiscountPercent, setBillDiscountPercent] = useState(
    initialInvoice?.billDiscountPercent ?? "0"
  );
  const [exchangeValue, setExchangeValue] = useState(initialInvoice?.exchangeValue ?? "0");
  const [vehicleNumber, setVehicleNumber] = useState(initialInvoice?.vehicleNumber ?? "");
  const [vehicleType, setVehicleType] = useState(initialInvoice?.vehicleType ?? "");
  const [notes, setNotes] = useState(initialInvoice?.notes ?? "");
  const [paymentMode, setPaymentMode] = useState<string>("CASH");
  const [fixingState, setFixingState] = useState(false);
  const [restoredDraft, setRestoredDraft] = useState(false);

  const storageKey = `invoice-draft-${draftKey}`;
  const hydrated = useRef(false);

  // Restore an in-progress draft on first mount (e.g. after a crashed tab).
  // localStorage only exists client-side, so this must run in an effect,
  // not a lazy useState initializer (which also runs during SSR).
  // Edit mode is always pre-filled from the DB — drafts don't apply.
  useEffect(() => {
    if (editMode) return;
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
          setPaymentMode(draft.paymentMode ?? "CASH");
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
    if (editMode || !hydrated.current) return;
    const draft: Draft = {
      partyId: selectedPartyId,
      rows,
      billDiscountPercent,
      exchangeValue,
      vehicleNumber,
      vehicleType,
      notes,
      paymentMode,
    };
    localStorage.setItem(storageKey, JSON.stringify(draft));
  }, [
    editMode,
    selectedPartyId,
    rows,
    billDiscountPercent,
    exchangeValue,
    vehicleNumber,
    vehicleType,
    notes,
    paymentMode,
    storageKey,
  ]);

  function discardDraft() {
    localStorage.removeItem(storageKey);
    setSelectedPartyId(null);
    setRows([]);
    setBillDiscountPercent("0");
    setExchangeValue("0");
    setVehicleNumber("");
    setVehicleType("");
    setNotes("");
    setPaymentMode("CASH");
    setRestoredDraft(false);
  }

  const partyComboOptions: ComboboxOption[] = useMemo(
    () => parties.map((p) => ({ id: p.id, label: p.name })),
    [parties]
  );
  const selectedPartyOption = partyComboOptions.find((p) => p.id === selectedPartyId) ?? null;
  const selectedParty = parties.find((p) => p.id === selectedPartyId);
  const interState = isInterState(tenantState, selectedParty?.state);

  const productComboOptions: ComboboxOption[] = useMemo(
    () =>
      products.map((p) => ({
        id: p.id,
        label: p.name,
        sublabel: `${Number(p.stockQty)} ${p.unit} in stock · ₹${Number(
          rateField === "sellingPrice" ? p.sellingPrice : p.purchasePrice
        ).toFixed(2)}${p.category ? ` · Fits: ${p.category}` : ""}`,
      })),
    [products, rateField]
  );

  const totals = useMemo(
    () => computeTotals(rows, billDiscountPercent, interState),
    [rows, billDiscountPercent, interState]
  );
  const preExchangeTotal =
    totals.taxableAmount + totals.cgstAmount + totals.sgstAmount + totals.igstAmount;
  const grandTotal = preExchangeTotal - (Number(exchangeValue) || 0);

  // "Round figure" pricing: the shopkeeper types the final total the customer
  // agreed to pay, and every item's rate is scaled proportionally so taxable
  // value and GST are derived backwards from that figure. The bill stays
  // GST-correct — it's just re-priced.
  const [totalDraft, setTotalDraft] = useState<string | null>(null);

  // ₹ contributed to the final total by one unit of rate on this row.
  function rateMultiplier(row: Row): number {
    const qty = Number(row.quantity) || 0;
    const itemDisc = Number(row.discountPercent) || 0;
    const billDisc = Number(billDiscountPercent) || 0;
    const gst = Number(row.gstRate) || 0;
    return qty * (1 - itemDisc / 100) * (1 - billDisc / 100) * (1 + gst / 100);
  }

  function applyRoundTotal() {
    if (totalDraft === null) return;
    const desired = Number(totalDraft);
    setTotalDraft(null);
    if (!Number.isFinite(desired) || desired <= 0) return;
    if (rows.length === 0 || preExchangeTotal <= 0) return;
    if (Math.abs(desired - grandTotal) < 0.005) return;

    const target = desired + (Number(exchangeValue) || 0);
    const scale = target / preExchangeTotal;
    pushRowHistory();

    const scaled = rows.map((row) => ({
      ...row,
      rate: (Math.round(Number(row.rate) * scale * 100) / 100).toFixed(2),
    }));
    // Rates are rounded to paise, so the scaled bill can miss the target by a
    // few paise — absorb the residue into the row with the largest amount.
    const achieved = scaled.reduce((sum, row) => sum + Number(row.rate) * rateMultiplier(row), 0);
    const residual = target - achieved;
    if (Math.abs(residual) >= 0.005) {
      let bestIdx = -1;
      let bestAmount = 0;
      scaled.forEach((row, i) => {
        const amount = Number(row.rate) * rateMultiplier(row);
        if (rateMultiplier(row) > 0 && amount >= bestAmount) {
          bestAmount = amount;
          bestIdx = i;
        }
      });
      if (bestIdx >= 0) {
        const row = scaled[bestIdx];
        const adjusted = Number(row.rate) + residual / rateMultiplier(row);
        scaled[bestIdx] = { ...row, rate: (Math.round(adjusted * 100) / 100).toFixed(2) };
      }
    }
    setRows(scaled);
  }

  function updateRow(key: string, patch: Partial<Row>) {
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  function buildRowFromProduct(productId: string): Row | null {
    const product = products.find((p) => p.id === productId);
    if (!product) return null;
    const batches = batchesByProduct?.[productId] ?? [];
    return {
      ...emptyRow(),
      productId: product.id,
      description: product.name,
      unit: product.unit,
      rate: rateField === "sellingPrice" ? product.sellingPrice : product.purchasePrice,
      gstRate: product.gstRate,
      batchId: batches[0]?.id ?? null,
    };
  }

  function onProductPick(key: string, productId: string | null) {
    if (!productId) {
      updateRow(key, { productId: null, batchId: null });
      return;
    }
    const built = buildRowFromProduct(productId);
    if (built) updateRow(key, built);
  }

  function pushRowHistory() {
    setRowHistory((prev) => [...prev.slice(-9), rows]);
  }

  function undoRows() {
    setRowHistory((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setRows(last);
      return prev.slice(0, -1);
    });
  }

  function onQuickAdd(item: ComboboxOption | null) {
    if (!item) return;
    const row = buildRowFromProduct(item.id);
    if (row) {
      pushRowHistory();
      setRows((prev) => [...prev, row]);
    }
    setQuickAddSelection(null);
  }

  function onQuickProductCreated(product: ProductOption) {
    setProducts((prev) => [...prev, product]);
    pushRowHistory();
    setRows((prev) => [
      ...prev,
      {
        ...emptyRow(),
        productId: product.id,
        description: product.name,
        unit: product.unit,
        rate: rateField === "sellingPrice" ? product.sellingPrice : product.purchasePrice,
        gstRate: product.gstRate,
      },
    ]);
  }

  async function fixPartyState(partyId: string, newState: string) {
    setFixingState(true);
    const result = await updatePartyState(partyId, newState);
    if (result.ok) {
      setParties((prev) => prev.map((p) => (p.id === partyId ? { ...p, state: newState } : p)));
    }
    setFixingState(false);
  }

  function stepQuantity(key: string, delta: number) {
    setRows((prev) =>
      prev.map((row) => {
        if (row.key !== key) return row;
        const next = Math.max(0, (Number(row.quantity) || 0) + delta);
        return { ...row, quantity: String(next) };
      })
    );
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
        if (!editMode) localStorage.removeItem(storageKey);
        return formAction(formData);
      }}
      className="flex flex-col gap-4"
    >
      <input type="hidden" name="itemsJson" value={itemsJson} />
      <input type="hidden" name="partyId" value={selectedPartyId ?? ""} />
      {!editMode && <input type="hidden" name="paymentMode" value={paymentMode} />}

      {restoredDraft && (
        <div className="border-warning/40 bg-warning/10 flex items-center justify-between rounded-lg border px-4 py-2 text-sm">
          <span>Restored an unsaved invoice draft.</span>
          <Button type="button" variant="ghost" size="sm" onClick={discardDraft}>
            <X /> Discard
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_340px] lg:items-start">
        {/* ---------------- Left column ---------------- */}
        <div className="flex min-w-0 flex-col gap-4">
          <div className="bg-card rounded-xl border shadow-sm">
            <div className="border-b px-5 py-3.5">
              <h2 className="text-sm font-bold">{partyLabel} &amp; invoice details</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3">
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
                    tenantState={tenantState}
                    onCreated={(party) => {
                      setParties((prev) => [...prev, party]);
                      setSelectedPartyId(party.id);
                    }}
                  />
                </div>
                {state?.errors?.partyId && (
                  <p className="text-destructive text-sm">{state.errors.partyId[0]}</p>
                )}
                {selectedParty && !selectedParty.state && (
                  <div className="border-warning/40 bg-warning/10 flex flex-col gap-2 rounded-lg border px-3 py-2">
                    <p className="text-xs">
                      This {partyLabel.toLowerCase()} has no state on file — GST defaults to
                      CGST+SGST until you set one.
                    </p>
                    <Select
                      disabled={fixingState}
                      onValueChange={(v) => fixPartyState(selectedParty.id, v as string)}
                    >
                      <SelectTrigger className="h-8 w-full text-xs">
                        <SelectValue placeholder="Set state now" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDIAN_STATES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              {invoiceNumberField && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="invoiceSequence">Bill number</Label>
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground shrink-0 text-sm">
                      {invoiceNumberField.prefix}
                    </span>
                    <Input
                      id="invoiceSequence"
                      name="invoiceSequence"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      placeholder={invoiceNumberField.placeholderSeq}
                      defaultValue={invoiceNumberField.defaultSeq ?? ""}
                      disabled={!invoiceNumberField.editable}
                    />
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {!invoiceNumberField.editable
                      ? "Numbered automatically. Enable invoice editing in Settings to set your own."
                      : editMode
                        ? "Only this bill is renumbered — new bills continue after the highest number."
                        : "Leave blank to auto-number. New bills continue after a custom number."}
                  </p>
                  {state?.errors?.invoiceSequence && (
                    <p className="text-destructive text-sm">{state.errors.invoiceSequence[0]}</p>
                  )}
                </div>
              )}
              <div className="flex flex-col gap-2">
                <Label htmlFor="invoiceDate">Invoice date</Label>
                <Input
                  id="invoiceDate"
                  name="invoiceDate"
                  type="date"
                  defaultValue={initialInvoice?.invoiceDate ?? new Date().toISOString().slice(0, 10)}
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

              {showTyreFields && (
                <>
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
                    <input type="hidden" name="vehicleType" value={vehicleType} />
                    <Select value={vehicleType} onValueChange={(v) => setVehicleType(v as string)}>
                      <SelectTrigger id="vehicleType" className="w-full">
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
                      <p className="text-destructive text-sm">{state.errors.exchangeValue[0]}</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="bg-card rounded-xl border shadow-sm">
            <div className="flex items-center justify-between border-b px-5 py-3.5">
              <h2 className="text-sm font-bold">Items</h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={undoRows}
                disabled={rowHistory.length === 0}
              >
                Undo
              </Button>
            </div>
            <div className="flex items-center gap-2 p-5 pb-0">
              <div className="border-input bg-secondary/30 focus-within:border-primary flex flex-1 items-center gap-2 rounded-lg border border-dashed px-3 py-1">
                <Search className="text-muted-foreground size-4 shrink-0" />
                <div className="flex-1">
                  <EntityCombobox
                    items={productComboOptions}
                    value={quickAddSelection}
                    onValueChange={onQuickAdd}
                    placeholder="Search or scan an item to add it..."
                    emptyText="No products found."
                    className="border-none bg-transparent px-0 shadow-none focus-visible:ring-0"
                  />
                </div>
              </div>
              <QuickAddProductDialog
                showTyreFields={isTyreTenant ?? showTyreFields}
                onCreated={onQuickProductCreated}
              />
            </div>

            <div className="mt-3">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    {batchesByProduct && <TableHead>Batch</TableHead>}
                    <TableHead className={showTyreFields ? "w-40" : "w-32"}>Qty</TableHead>
                    <TableHead className={showTyreFields ? "w-32" : "w-24"}>Rate</TableHead>
                    {!showTyreFields && <TableHead className="w-20">Disc %</TableHead>}
                    <TableHead className="w-20">GST %</TableHead>
                    <TableHead className={showTyreFields ? "w-28 text-right" : "w-24 text-right"}>
                      Amount
                    </TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={
                          6 + (batchesByProduct ? 1 : 0) + (!showTyreFields ? 1 : 0)
                        }
                        className="text-muted-foreground py-8 text-center text-sm"
                      >
                        No items yet — search above to add one.
                      </TableCell>
                    </TableRow>
                  )}
                  {rows.map((row) => {
                    const rowBatches = row.productId ? (batchesByProduct?.[row.productId] ?? []) : [];
                    const selectedProduct = row.productId
                      ? products.find((p) => p.id === row.productId)
                      : undefined;
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
                          <div className="flex flex-col gap-1">
                            <EntityCombobox
                              items={productComboOptions}
                              value={selectedProductOption}
                              onValueChange={(item) => onProductPick(row.key, item?.id ?? null)}
                              placeholder="Search or type custom..."
                              emptyText="No products found."
                              className="w-44"
                            />
                            <Input
                              value={row.description}
                              onChange={(e) => updateRow(row.key, { description: e.target.value })}
                              placeholder="Description"
                              className="text-muted-foreground h-7 w-44 text-xs"
                            />
                          </div>
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
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => stepQuantity(row.key, -1)}
                              className={`border-input bg-secondary/40 hover:bg-accent flex shrink-0 items-center justify-center rounded border ${showTyreFields ? "size-8" : "size-6"}`}
                              aria-label="Decrease quantity"
                            >
                              <Minus className={showTyreFields ? "size-4" : "size-3"} />
                            </button>
                            <Input
                              type="number"
                              step="0.001"
                              value={row.quantity}
                              onChange={(e) => updateRow(row.key, { quantity: e.target.value })}
                              aria-invalid={overselling}
                              className={`text-center tabular-nums ${showTyreFields ? "h-9 w-16 text-base" : "h-7 w-14"} ${overselling ? "border-destructive" : ""}`}
                            />
                            <button
                              type="button"
                              onClick={() => stepQuantity(row.key, 1)}
                              className={`border-input bg-secondary/40 hover:bg-accent flex shrink-0 items-center justify-center rounded border ${showTyreFields ? "size-8" : "size-6"}`}
                              aria-label="Increase quantity"
                            >
                              <Plus className={showTyreFields ? "size-4" : "size-3"} />
                            </button>
                          </div>
                          <Select value={row.unit} onValueChange={(v) => updateRow(row.key, { unit: v as string })}>
                            <SelectTrigger className="mt-1 h-6 w-full text-xs" size="sm">
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
                          {overselling && (
                            <p className="text-destructive mt-1 text-xs whitespace-nowrap">
                              Only {availableStock} in stock
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            value={row.rate}
                            onChange={(e) => updateRow(row.key, { rate: e.target.value })}
                            className={`tabular-nums ${showTyreFields ? "h-9 text-base" : ""}`}
                          />
                        </TableCell>
                        {!showTyreFields && (
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              value={row.discountPercent}
                              onChange={(e) => updateRow(row.key, { discountPercent: e.target.value })}
                              className="tabular-nums"
                            />
                          </TableCell>
                        )}
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            value={row.gstRate}
                            onChange={(e) => updateRow(row.key, { gstRate: e.target.value })}
                            className="tabular-nums"
                          />
                        </TableCell>
                        <TableCell
                          className={`text-right font-medium tabular-nums ${showTyreFields ? "text-base" : ""}`}
                        >
                          ₹{lineTotal(row).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <button
                            type="button"
                            onClick={() => {
                              pushRowHistory();
                              setRows((prev) => prev.filter((r) => r.key !== row.key));
                            }}
                            className="text-muted-foreground hover:text-destructive p-1"
                            aria-label="Remove item"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            {state?.errors?.itemsJson && (
              <p className="text-destructive px-5 pb-4 text-sm">{state.errors.itemsJson[0]}</p>
            )}
            {rows.length === 0 && !state?.errors?.itemsJson && <div className="pb-2" />}
          </div>

          <div className="bg-card rounded-xl border shadow-sm">
            <div className="border-b px-5 py-3.5">
              <h2 className="text-sm font-bold">Notes</h2>
            </div>
            <div className="p-5">
              <textarea
                id="notes"
                name="notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional note printed on the invoice..."
                className="border-input dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-lg border bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-3"
              />
            </div>
          </div>
        </div>

        {/* ---------------- Sticky summary ---------------- */}
        <div className="bg-card sticky top-4 flex flex-col rounded-xl border shadow-sm">
          <div className="border-b px-5 py-3.5">
            <h2 className="text-sm font-bold">Bill summary</h2>
          </div>
          <div className="flex flex-col gap-2.5 px-5 py-4 text-sm">
            <div className="text-muted-foreground flex items-center justify-between">
              <span>Subtotal</span>
              <span className="text-foreground font-medium tabular-nums">
                ₹{totals.subtotal.toFixed(2)}
              </span>
            </div>
            {totals.discountAmount > 0 && (
              <div className="text-muted-foreground flex items-center justify-between">
                <span>Discount</span>
                <span className="text-foreground font-medium tabular-nums">
                  −₹{totals.discountAmount.toFixed(2)}
                </span>
              </div>
            )}
            {interState ? (
              <div
                className={`text-muted-foreground flex items-center justify-between ${showTyreFields ? "text-base" : ""}`}
              >
                <span>IGST</span>
                <span className="text-foreground font-semibold tabular-nums">
                  ₹{totals.igstAmount.toFixed(2)}
                </span>
              </div>
            ) : (
              <>
                <div
                  className={`text-muted-foreground flex items-center justify-between ${showTyreFields ? "text-base" : ""}`}
                >
                  <span>CGST</span>
                  <span className="text-foreground font-semibold tabular-nums">
                    ₹{totals.cgstAmount.toFixed(2)}
                  </span>
                </div>
                <div
                  className={`text-muted-foreground flex items-center justify-between ${showTyreFields ? "text-base" : ""}`}
                >
                  <span>SGST</span>
                  <span className="text-foreground font-semibold tabular-nums">
                    ₹{totals.sgstAmount.toFixed(2)}
                  </span>
                </div>
              </>
            )}
            {showTyreFields && Number(exchangeValue) > 0 && (
              <div className="text-muted-foreground flex items-center justify-between">
                <span>Old tyre exchange</span>
                <span className="text-foreground font-medium tabular-nums">
                  −₹{Number(exchangeValue).toFixed(2)}
                </span>
              </div>
            )}
            <div className="my-1 border-t" />
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold">Total payable</span>
              <div className="flex items-center gap-1">
                <span className="text-primary text-2xl font-bold">₹</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  aria-label="Total payable — edit to re-price the bill"
                  value={totalDraft ?? grandTotal.toFixed(2)}
                  onFocus={() => setTotalDraft(grandTotal.toFixed(2))}
                  onChange={(e) => setTotalDraft(e.target.value)}
                  onBlur={applyRoundTotal}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      e.currentTarget.blur();
                    }
                  }}
                  disabled={rows.length === 0}
                  className="text-primary h-10 w-36 text-right !text-2xl font-bold tabular-nums"
                />
              </div>
            </div>
            <p className="text-muted-foreground text-xs">
              Type a round figure and press Enter — item rates, taxable value, and GST re-adjust
              automatically. Server recalculates the exact figure on save.
            </p>
          </div>

          {editMode ? (
            <p className="text-muted-foreground px-5 pb-2 text-xs">
              Recorded payments stay unchanged — manage them from the invoice page.
            </p>
          ) : (
            <>
              <div className="flex flex-col gap-2 px-5 pb-2">
                <Label htmlFor="amountPaid">Amount paid now</Label>
                <Input id="amountPaid" name="amountPaid" type="number" step="0.01" defaultValue="0" />
                {state?.errors?.amountPaid && (
                  <p className="text-destructive text-sm">{state.errors.amountPaid[0]}</p>
                )}
              </div>

              <div className="flex flex-col gap-2 px-5 py-3">
                <Label>Payment mode</Label>
                <div className="flex flex-wrap gap-1.5">
                  {PAYMENT_MODES.map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPaymentMode(mode)}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                        paymentMode === mode
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-input bg-secondary/40 text-foreground hover:bg-accent"
                      }`}
                    >
                      {mode.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {state?.message && <p className="text-destructive px-5 text-sm">{state.message}</p>}

          <div className="mt-1 flex flex-col gap-2 border-t px-5 py-4">
            <Button type="submit" disabled={pending} className="w-full justify-center">
              {pending ? "Saving..." : submitLabel}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
