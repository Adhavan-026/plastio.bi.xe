import { getTenantDb, getTenantContext } from "@/lib/tenant-db";
import { prisma } from "@/lib/prisma";
import { createSalesInvoice } from "@/app/actions/invoices";
import { InvoiceForm, type BatchOption } from "@/components/billing/invoice-form";

export default async function NewSalesInvoicePage() {
  const { tenantId } = await getTenantContext();
  const db = await getTenantDb();

  const [tenant, products, parties] = await Promise.all([
    prisma.tenant.findUniqueOrThrow({ where: { id: tenantId }, select: { businessType: true } }),
    db.product.findMany({
      where: { isActive: true },
      select: { id: true, name: true, unit: true, gstRate: true, sellingPrice: true, purchasePrice: true },
      orderBy: { name: "asc" },
    }),
    db.party.findMany({
      where: { isActive: true, type: { in: ["CUSTOMER", "BOTH"] } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  let batchesByProduct: Record<string, BatchOption[]> | undefined;
  if (tenant.businessType === "AGRO") {
    const batches = await db.stockBatch.findMany({
      where: { quantity: { gt: 0 } },
      orderBy: { expiryDate: "asc" },
    });
    batchesByProduct = {};
    for (const batch of batches) {
      const list = (batchesByProduct[batch.productId] ??= []);
      list.push({
        id: batch.id,
        batchNumber: batch.batchNumber,
        expiryDate: batch.expiryDate ? batch.expiryDate.toLocaleDateString("en-IN") : null,
        quantity: batch.quantity.toString(),
      });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">New sales invoice</h1>
      <InvoiceForm
        action={createSalesInvoice}
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          unit: p.unit,
          gstRate: p.gstRate.toString(),
          sellingPrice: p.sellingPrice.toString(),
          purchasePrice: p.purchasePrice.toString(),
        }))}
        parties={parties}
        partyLabel="Customer"
        rateField="sellingPrice"
        submitLabel="Create invoice"
        batchesByProduct={batchesByProduct}
        showTyreFields={tenant.businessType === "TYRE"}
      />
    </div>
  );
}
