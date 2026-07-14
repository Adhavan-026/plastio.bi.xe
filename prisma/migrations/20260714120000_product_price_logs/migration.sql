-- CreateTable
CREATE TABLE "product_price_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "purchasePrice" DECIMAL(12,2) NOT NULL,
    "sellingPrice" DECIMAL(12,2) NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_price_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_price_logs_tenantId_idx" ON "product_price_logs"("tenantId");

-- CreateIndex
CREATE INDEX "product_price_logs_productId_idx" ON "product_price_logs"("productId");

-- AddForeignKey
ALTER TABLE "product_price_logs" ADD CONSTRAINT "product_price_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_price_logs" ADD CONSTRAINT "product_price_logs_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
