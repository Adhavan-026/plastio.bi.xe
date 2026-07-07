import { getTenantDb } from "@/lib/tenant-db";
import { SalesInvoiceForm } from "./sales-invoice-form";

export default async function NewSalesInvoicePage() {
  const db = await getTenantDb();

  const [products, parties] = await Promise.all([
    db.product.findMany({
      where: { isActive: true },
      select: { id: true, name: true, unit: true, gstRate: true, sellingPrice: true },
      orderBy: { name: "asc" },
    }),
    db.party.findMany({
      where: { isActive: true, type: { in: ["CUSTOMER", "BOTH"] } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">New sales invoice</h1>
      <SalesInvoiceForm
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          unit: p.unit,
          gstRate: p.gstRate.toString(),
          sellingPrice: p.sellingPrice.toString(),
        }))}
        parties={parties}
      />
    </div>
  );
}
