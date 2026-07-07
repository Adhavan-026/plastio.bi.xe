-- CreateEnum
CREATE TYPE "AdjustmentReason" AS ENUM ('DAMAGE', 'LOSS', 'CORRECTION', 'OPENING_STOCK', 'OTHER');

-- CreateTable
CREATE TABLE "stock_adjustments" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantityChange" DECIMAL(12,3) NOT NULL,
    "reason" "AdjustmentReason" NOT NULL,
    "notes" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stock_adjustments_tenantId_idx" ON "stock_adjustments"("tenantId");

-- CreateIndex
CREATE INDEX "stock_adjustments_tenantId_productId_idx" ON "stock_adjustments"("tenantId", "productId");

-- AddForeignKey
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
