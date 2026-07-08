-- AlterTable
ALTER TABLE "invoice_items" ADD COLUMN     "batchId" TEXT,
ADD COLUMN     "tyreSerialNumber" TEXT,
ADD COLUMN     "warrantyMonths" INTEGER;

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "exchangeValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "vehicleNumber" TEXT,
ADD COLUMN     "vehicleType" TEXT;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "tyreBrand" TEXT,
ADD COLUMN     "tyreLoadIndex" TEXT,
ADD COLUMN     "tyrePattern" TEXT,
ADD COLUMN     "tyreSize" TEXT;

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "licenseNumber" TEXT;

-- CreateTable
CREATE TABLE "stock_batches" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "mfgDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "quantity" DECIMAL(12,3) NOT NULL,
    "purchasePrice" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_batches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stock_batches_tenantId_idx" ON "stock_batches"("tenantId");

-- CreateIndex
CREATE INDEX "stock_batches_tenantId_productId_idx" ON "stock_batches"("tenantId", "productId");

-- CreateIndex
CREATE INDEX "invoice_items_tenantId_tyreSerialNumber_idx" ON "invoice_items"("tenantId", "tyreSerialNumber");

-- AddForeignKey
ALTER TABLE "stock_batches" ADD CONSTRAINT "stock_batches_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_batches" ADD CONSTRAINT "stock_batches_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "stock_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
