import { NextResponse } from "next/server";
import { getTenantContext, getTenantDb } from "@/lib/tenant-db";
import { prisma } from "@/lib/prisma";

// Full data export for the logged-in shop, downloaded to the owner's device
// on logout. Excludes secrets (password hashes, license/activation keys).
export async function GET() {
  const { tenantId } = await getTenantContext();
  const db = await getTenantDb();

  const [tenant, users, products, parties, invoices, stockBatches, stockAdjustments] =
    await Promise.all([
      prisma.tenant.findUniqueOrThrow({
        where: { id: tenantId },
        select: {
          name: true,
          businessType: true,
          gstNumber: true,
          phone: true,
          address: true,
          state: true,
          licenseNumber: true,
          defaultWarrantyMonths: true,
          createdAt: true,
        },
      }),
      db.user.findMany({
        select: { name: true, email: true, role: true, isActive: true, createdAt: true },
      }),
      db.product.findMany({ orderBy: { name: "asc" } }),
      db.party.findMany({ orderBy: { name: "asc" } }),
      db.invoice.findMany({
        include: { items: true, payments: true },
        orderBy: { invoiceDate: "asc" },
      }),
      db.stockBatch.findMany(),
      db.stockAdjustment.findMany({ orderBy: { createdAt: "asc" } }),
    ]);

  const backup = {
    app: "Plastio.xe",
    format: 1,
    exportedAt: new Date().toISOString(),
    shop: tenant,
    users,
    products,
    parties,
    invoices,
    stockBatches,
    stockAdjustments,
  };

  return NextResponse.json(backup, {
    headers: { "Cache-Control": "no-store" },
  });
}
