import { getTenantDb } from "@/lib/tenant-db";
import { createPurchaseInvoice } from "@/app/actions/invoices";
import { InvoiceForm } from "@/components/billing/invoice-form";

export default async function NewPurchaseInvoicePage() {
  const db = await getTenantDb();

  const [products, parties] = await Promise.all([
    db.product.findMany({
      where: { isActive: true },
      select: { id: true, name: true, unit: true, gstRate: true, sellingPrice: true, purchasePrice: true },
      orderBy: { name: "asc" },
    }),
    db.party.findMany({
      where: { isActive: true, type: { in: ["SUPPLIER", "BOTH"] } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">New purchase invoice</h1>
      <InvoiceForm
        action={createPurchaseInvoice}
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          unit: p.unit,
          gstRate: p.gstRate.toString(),
          sellingPrice: p.sellingPrice.toString(),
          purchasePrice: p.purchasePrice.toString(),
        }))}
        parties={parties}
        partyLabel="Supplier"
        rateField="purchasePrice"
        submitLabel="Create purchase invoice"
      />
    </div>
  );
}
