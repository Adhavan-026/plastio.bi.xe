"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type SaleItemDetail = {
  product: string;
  quantity: number;
  buyingPrice: number;
  sellingPrice: number;
  income: number;
  profitAmount: number;
};

export function SaleDetailDialog({
  invoiceNumber,
  date,
  customer,
  items,
}: {
  invoiceNumber: string;
  date: string;
  customer: string;
  items: SaleItemDetail[];
}) {
  const [open, setOpen] = useState(false);
  const totalIncome = items.reduce((sum, i) => sum + i.income, 0);
  const totalProfit = items.reduce((sum, i) => sum + i.profitAmount, 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => setOpen(true)}
        aria-label={`View bill detail for ${invoiceNumber}`}
      >
        <Eye />
      </Button>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{invoiceNumber}</DialogTitle>
          <p className="text-muted-foreground text-xs">
            {new Date(date).toLocaleDateString("en-IN")} · {customer}
          </p>
        </DialogHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Buying price</TableHead>
                <TableHead className="text-right">Selling price</TableHead>
                <TableHead className="text-right">Income</TableHead>
                <TableHead className="text-right">Profit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{item.product}</TableCell>
                  <TableCell className="text-right tabular-nums">{item.quantity}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    ₹{item.buyingPrice.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    ₹{item.sellingPrice.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    ₹{item.income.toFixed(2)}
                  </TableCell>
                  <TableCell
                    className={`text-right tabular-nums font-medium ${item.profitAmount < 0 ? "text-destructive" : ""}`}
                  >
                    ₹{item.profitAmount.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={4} className="font-medium">
                  Total
                </TableCell>
                <TableCell className="text-right font-medium">₹{totalIncome.toFixed(2)}</TableCell>
                <TableCell className="text-right font-medium">₹{totalProfit.toFixed(2)}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
