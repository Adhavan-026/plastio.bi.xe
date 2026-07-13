import Link from "next/link";
import { getTenantDb, getTenantContext } from "@/lib/tenant-db";
import { prisma } from "@/lib/prisma";
import { createSalesInvoice } from "@/app/actions/invoices";
import { peekNextInvoiceNumber } from "@/lib/billing/invoice-number";
import { InvoiceForm, type BatchOption } from "@/components/billing/invoice-form";
import { requireActiveSubscription } from "@/lib/billing/subscription";
import { BackButton } from "@/components/dashboard/back-button";
import { Button } from "@/components/ui/button";

export default async function NewSalesInvoicePage() {
  await requireActiveSubscription();
  const { tenantId, role } = await getTenantContext();
  const db = await getTenantDb();

  const [tenant, nextNumber, products, parties] = await Promise.all([
    prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      select: { businessType: true, state: true, allowInvoiceEdit: true },
    }),
    peekNextInvoiceNumber(prisma, tenantId, "SALES", new Date()),
    db.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        unit: true,
        gstRate: true,
        sellingPrice: true,
        purchasePrice: true,
        stockQty: true,
        category: true,
      },
      orderBy: { name: "asc" },
    }),
    db.party.findMany({
      where: { isActive: true, type: { in: ["CUSTOMER", "BOTH"] } },
      select: { id: true, name: true, state: true },
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
      <BackButton />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">New sales invoice</h1>
        <Button render={<Link href="/dashboard/invoices" />} nativeButton={false} variant="outline">
          Finish
        </Button>
      </div>
      <InvoiceForm
        action={createSalesInvoice}
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          unit: p.unit,
          gstRate: p.gstRate.toString(),
          sellingPrice: p.sellingPrice.toString(),
          purchasePrice: p.purchasePrice.toString(),
          stockQty: p.stockQty.toString(),
          category: p.category,
        }))}
        parties={parties}
        partyLabel="Customer"
        rateField="sellingPrice"
        submitLabel="Create invoice"
        batchesByProduct={batchesByProduct}
        showTyreFields={tenant.businessType === "TYRE"}
        isTyreTenant={tenant.businessType === "TYRE"}
        draftKey="sales"
        tenantState={tenant.state}
        invoiceNumberField={{
          prefix: nextNumber.prefix,
          placeholderSeq: nextNumber.nextSeq.toString().padStart(4, "0"),
          editable: tenant.allowInvoiceEdit && (role === "OWNER" || role === "MANAGER"),
        }}
      />
    </div>
  );
}
