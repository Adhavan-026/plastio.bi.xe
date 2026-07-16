import Link from "next/link";
import { notFound } from "next/navigation";
import { getTenantDb, getTenantContext } from "@/lib/tenant-db";
import { prisma } from "@/lib/prisma";
import { updateInvoice } from "@/app/actions/invoices";
import { canEditInvoice } from "@/lib/billing/invoice-edit";
import { splitInvoiceNumber } from "@/lib/billing/invoice-number";
import { InvoiceForm, type BatchOption, type Row } from "@/components/billing/invoice-form";
import { requireActiveSubscription } from "@/lib/billing/subscription";
import { BackButton } from "@/components/dashboard/back-button";
import { Button } from "@/components/ui/button";

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  await requireActiveSubscription();
  const { id } = await params;
  const { tenantId, role } = await getTenantContext();
  const db = await getTenantDb();

  const [tenant, invoice] = await Promise.all([
    prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } }),
    db.invoice.findUnique({ where: { id }, include: { items: true } }),
  ]);

  if (!invoice || invoice.type === "QUOTATION") notFound();

  if (!canEditInvoice(tenant, invoice, role)) {
    return (
      <div className="flex flex-col items-start gap-4">
        <BackButton />
        <h1 className="text-2xl font-semibold">Edit invoice</h1>
        <p className="text-muted-foreground text-sm">
          {tenant.allowInvoiceEdit
            ? `This invoice is older than the ${tenant.invoiceEditWindowDays}-day edit window.`
            : "Invoice editing is disabled. The owner can enable it in Settings."}
        </p>
        <Button render={<Link href={`/dashboard/invoices/${invoice.id}`} />} nativeButton={false} variant="outline">
          Back to invoice
        </Button>
      </div>
    );
  }

  const isPurchase = invoice.type === "PURCHASE";
  const partyTypes = isPurchase ? (["SUPPLIER", "BOTH"] as const) : (["CUSTOMER", "BOTH"] as const);

  const [products, parties, categories] = await Promise.all([
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
        categoryId: true,
        tyreSize: true,
        tyreBrand: true,
      },
      orderBy: { name: "asc" },
    }),
    db.party.findMany({
      where: { isActive: true, type: { in: [...partyTypes] } },
      select: { id: true, name: true, state: true },
      orderBy: { name: "asc" },
    }),
    db.productCategory.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  let batchesByProduct: Record<string, BatchOption[]> | undefined;
  if (tenant.businessType === "AGRO" && !isPurchase) {
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

  // Numbers not in the app-generated TYPE/FY/NNNN shape can't be renumbered —
  // the field is simply not shown for them.
  const numberParts = splitInvoiceNumber(invoice.invoiceNumber);
  const paddedSeq = numberParts ? numberParts.seq.toString().padStart(4, "0") : null;

  // Deterministic keys — this renders on the server too, so no randomUUID here.
  const rows: Row[] = invoice.items.map((item, i) => ({
    key: `edit-${i}`,
    productId: item.productId,
    description: item.description,
    quantity: item.quantity.toString(),
    unit: item.unit,
    rate: item.rate.toString(),
    discountPercent: item.discountPercent.toString(),
    gstRate: item.gstRate.toString(),
    batchId: item.batchId,
    tyreSerialNumber: item.tyreSerialNumber ?? "",
    warrantyMonths: item.warrantyMonths?.toString() ?? "",
  }));

  return (
    <div className="flex flex-col gap-6">
      <BackButton />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Edit {isPurchase ? "purchase" : "invoice"} {invoice.invoiceNumber}</h1>
          <p className="text-muted-foreground text-sm">
            Stock is re-adjusted and GST recomputed when you save. Recorded payments stay unchanged.
          </p>
        </div>
        <Button render={<Link href={`/dashboard/invoices/${invoice.id}`} />} nativeButton={false} variant="outline">
          Cancel
        </Button>
      </div>
      <InvoiceForm
        action={updateInvoice.bind(null, invoice.id)}
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          unit: p.unit,
          gstRate: p.gstRate.toString(),
          sellingPrice: p.sellingPrice.toString(),
          purchasePrice: p.purchasePrice.toString(),
          stockQty: p.stockQty.toString(),
          category: p.category,
          categoryId: p.categoryId,
          tyreSize: p.tyreSize,
          tyreBrand: p.tyreBrand,
        }))}
        parties={parties}
        partyLabel={isPurchase ? "Supplier" : "Customer"}
        rateField={isPurchase ? "purchasePrice" : "sellingPrice"}
        submitLabel="Save changes"
        batchesByProduct={batchesByProduct}
        showTyreFields={!isPurchase && tenant.businessType === "TYRE"}
        isTyreTenant={tenant.businessType === "TYRE"}
        categories={categories}
        draftKey={`edit-${invoice.id}`}
        tenantState={tenant.state}
        invoiceNumberField={
          numberParts && paddedSeq
            ? {
                prefix: numberParts.prefix,
                placeholderSeq: paddedSeq,
                defaultSeq: paddedSeq,
                editable: true,
              }
            : undefined
        }
        initialInvoice={{
          partyId: invoice.partyId,
          invoiceDate: invoice.invoiceDate.toISOString().slice(0, 10),
          billDiscountPercent: "0",
          exchangeValue: invoice.exchangeValue.toString(),
          vehicleNumber: invoice.vehicleNumber ?? "",
          vehicleType: invoice.vehicleType ?? "",
          notes: invoice.notes ?? "",
          rows,
        }}
      />
    </div>
  );
}
