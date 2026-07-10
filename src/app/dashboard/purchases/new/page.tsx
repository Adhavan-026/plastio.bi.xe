import Link from "next/link";
import { getTenantDb, getTenantContext } from "@/lib/tenant-db";
import { prisma } from "@/lib/prisma";
import { createPurchaseInvoice } from "@/app/actions/invoices";
import { peekNextInvoiceNumber } from "@/lib/billing/invoice-number";
import { InvoiceForm } from "@/components/billing/invoice-form";
import { Button } from "@/components/ui/button";

export default async function NewPurchaseInvoicePage() {
  const { tenantId, role } = await getTenantContext();
  const db = await getTenantDb();

  const [tenant, nextNumber, products, parties] = await Promise.all([
    prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      select: { state: true, businessType: true, allowInvoiceEdit: true },
    }),
    peekNextInvoiceNumber(prisma, tenantId, "PURCHASE", new Date()),
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
      where: { isActive: true, type: { in: ["SUPPLIER", "BOTH"] } },
      select: { id: true, name: true, state: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">New purchase invoice</h1>
        <Button render={<Link href="/dashboard/purchases" />} nativeButton={false} variant="outline">
          Finish
        </Button>
      </div>
      <InvoiceForm
        action={createPurchaseInvoice}
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
        partyLabel="Supplier"
        rateField="purchasePrice"
        submitLabel="Create purchase invoice"
        draftKey="purchase"
        tenantState={tenant.state}
        isTyreTenant={tenant.businessType === "TYRE"}
        invoiceNumberField={{
          prefix: nextNumber.prefix,
          placeholderSeq: nextNumber.nextSeq.toString().padStart(4, "0"),
          editable: tenant.allowInvoiceEdit && (role === "OWNER" || role === "MANAGER"),
        }}
      />
    </div>
  );
}
