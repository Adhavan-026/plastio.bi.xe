"use client";

import { useActionState, useEffect, useState } from "react";
import { IndianRupee } from "lucide-react";
import { updateProductPrice, getProductPriceLog } from "@/app/actions/product-price";
import type { ProductPriceLogEntry } from "@/lib/validations/product-price";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function marginOf(purchasePrice: number, sellingPrice: number) {
  const profit = sellingPrice - purchasePrice;
  const marginPercent = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;
  return { profit, marginPercent };
}

export function PriceManagementDialog({
  product,
}: {
  product: { id: string; name: string; purchasePrice: string; sellingPrice: string };
}) {
  const [open, setOpen] = useState(false);
  const [purchasePrice, setPurchasePrice] = useState(product.purchasePrice);
  const [sellingPrice, setSellingPrice] = useState(product.sellingPrice);
  const [log, setLog] = useState<ProductPriceLogEntry[]>([]);
  const [loadingLog, setLoadingLog] = useState(false);
  const [state, formAction, pending] = useActionState(updateProductPrice, undefined);

  useEffect(() => {
    if (!open) return;
    setLoadingLog(true);
    getProductPriceLog(product.id)
      .then(setLog)
      .finally(() => setLoadingLog(false));
    // Re-fetch whenever the dialog is (re)opened, and right after a save.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, state]);

  const { profit, marginPercent } = marginOf(Number(purchasePrice) || 0, Number(sellingPrice) || 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <IndianRupee /> Price
      </Button>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Price management — {product.name}</DialogTitle>
        </DialogHeader>

        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="productId" value={product.id} />
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="purchasePrice">Buying price</Label>
              <Input
                id="purchasePrice"
                name="purchasePrice"
                type="number"
                step="0.01"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                required
              />
              {state?.errors?.purchasePrice && (
                <p className="text-destructive text-sm">{state.errors.purchasePrice[0]}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="sellingPrice">Selling price</Label>
              <Input
                id="sellingPrice"
                name="sellingPrice"
                type="number"
                step="0.01"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                required
              />
              {state?.errors?.sellingPrice && (
                <p className="text-destructive text-sm">{state.errors.sellingPrice[0]}</p>
              )}
            </div>
          </div>

          <div className="bg-secondary/40 flex items-center justify-between rounded-lg px-3 py-2 text-sm">
            <span className="text-muted-foreground">Profit at these prices</span>
            <span className={`font-semibold tabular-nums ${profit < 0 ? "text-destructive" : ""}`}>
              ₹{profit.toFixed(2)} ({marginPercent.toFixed(1)}%)
            </span>
          </div>

          {state?.message && <p className="text-destructive text-sm">{state.message}</p>}

          <DialogFooter className="-mx-0 -mb-0 border-t-0 bg-transparent p-0 sm:justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : "Save price"}
            </Button>
          </DialogFooter>
        </form>

        <div className="flex flex-col gap-2 border-t pt-4">
          <h3 className="text-sm font-bold">Price history</h3>
          {loadingLog ? (
            <p className="text-muted-foreground text-sm">Loading...</p>
          ) : log.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No price changes logged yet — saving above starts the history.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Buying</TableHead>
                  <TableHead className="text-right">Selling</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                  <TableHead className="text-right">Margin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {log.map((entry) => {
                  const { profit: entryProfit, marginPercent: entryMargin } = marginOf(
                    Number(entry.purchasePrice),
                    Number(entry.sellingPrice)
                  );
                  return (
                    <TableRow key={entry.id}>
                      <TableCell className="text-xs">
                        {new Date(entry.changedAt).toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        ₹{Number(entry.purchasePrice).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        ₹{Number(entry.sellingPrice).toFixed(2)}
                      </TableCell>
                      <TableCell
                        className={`text-right tabular-nums ${entryProfit < 0 ? "text-destructive" : ""}`}
                      >
                        ₹{entryProfit.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {entryMargin.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
