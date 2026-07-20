-- AlterTable
ALTER TABLE "parties" ADD COLUMN     "isJobWorker" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "qtyWithJobWorker" DECIMAL(12,3) NOT NULL DEFAULT 0,
ADD COLUMN     "stockCategory" TEXT NOT NULL DEFAULT 'TRADE',
ADD COLUMN     "wipQty" DECIMAL(12,3) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "maxWastagePercent" DECIMAL(5,2) NOT NULL DEFAULT 5;

-- CreateTable
CREATE TABLE "boms" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "outputProductId" TEXT NOT NULL,
    "outputQty" DECIMAL(12,3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "boms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bom_lines" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "bomId" TEXT NOT NULL,
    "inputProductId" TEXT NOT NULL,
    "qty" DECIMAL(12,3) NOT NULL,
    "wastagePercent" DECIMAL(5,2) NOT NULL DEFAULT 0,

    CONSTRAINT "bom_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_runs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "runNumber" TEXT NOT NULL,
    "bomId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "yieldPercent" DECIMAL(5,2),
    "wastageExceeded" BOOLEAN NOT NULL DEFAULT false,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "production_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_inputs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "qty" DECIMAL(12,3) NOT NULL,
    "unitCost" DECIMAL(12,2) NOT NULL DEFAULT 0,

    CONSTRAINT "production_inputs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_outputs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "qty" DECIMAL(12,3) NOT NULL,
    "outputType" TEXT NOT NULL DEFAULT 'FINISHED',

    CONSTRAINT "production_outputs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_work_challans" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "challanNumber" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedReturnDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "linkedChallanId" TEXT,
    "notes" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_work_challans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_work_challan_lines" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "challanId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "qty" DECIMAL(12,3) NOT NULL,
    "description" TEXT,

    CONSTRAINT "job_work_challan_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_ledger" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "qty" DECIMAL(12,3) NOT NULL,
    "bucket" TEXT NOT NULL DEFAULT 'ON_HAND',
    "reason" TEXT NOT NULL,
    "refType" TEXT NOT NULL,
    "refId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "boms_tenantId_idx" ON "boms"("tenantId");

-- CreateIndex
CREATE INDEX "boms_tenantId_outputProductId_idx" ON "boms"("tenantId", "outputProductId");

-- CreateIndex
CREATE INDEX "bom_lines_tenantId_idx" ON "bom_lines"("tenantId");

-- CreateIndex
CREATE INDEX "bom_lines_bomId_idx" ON "bom_lines"("bomId");

-- CreateIndex
CREATE INDEX "production_runs_tenantId_idx" ON "production_runs"("tenantId");

-- CreateIndex
CREATE INDEX "production_runs_tenantId_status_idx" ON "production_runs"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "production_runs_tenantId_runNumber_key" ON "production_runs"("tenantId", "runNumber");

-- CreateIndex
CREATE INDEX "production_inputs_tenantId_idx" ON "production_inputs"("tenantId");

-- CreateIndex
CREATE INDEX "production_inputs_runId_idx" ON "production_inputs"("runId");

-- CreateIndex
CREATE INDEX "production_outputs_tenantId_idx" ON "production_outputs"("tenantId");

-- CreateIndex
CREATE INDEX "production_outputs_runId_idx" ON "production_outputs"("runId");

-- CreateIndex
CREATE INDEX "job_work_challans_tenantId_idx" ON "job_work_challans"("tenantId");

-- CreateIndex
CREATE INDEX "job_work_challans_tenantId_status_idx" ON "job_work_challans"("tenantId", "status");

-- CreateIndex
CREATE INDEX "job_work_challans_tenantId_partyId_idx" ON "job_work_challans"("tenantId", "partyId");

-- CreateIndex
CREATE UNIQUE INDEX "job_work_challans_tenantId_challanNumber_key" ON "job_work_challans"("tenantId", "challanNumber");

-- CreateIndex
CREATE INDEX "job_work_challan_lines_tenantId_idx" ON "job_work_challan_lines"("tenantId");

-- CreateIndex
CREATE INDEX "job_work_challan_lines_challanId_idx" ON "job_work_challan_lines"("challanId");

-- CreateIndex
CREATE INDEX "stock_ledger_tenantId_idx" ON "stock_ledger"("tenantId");

-- CreateIndex
CREATE INDEX "stock_ledger_tenantId_productId_idx" ON "stock_ledger"("tenantId", "productId");

-- CreateIndex
CREATE INDEX "stock_ledger_tenantId_refType_refId_idx" ON "stock_ledger"("tenantId", "refType", "refId");

-- AddForeignKey
ALTER TABLE "boms" ADD CONSTRAINT "boms_outputProductId_fkey" FOREIGN KEY ("outputProductId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boms" ADD CONSTRAINT "boms_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bom_lines" ADD CONSTRAINT "bom_lines_bomId_fkey" FOREIGN KEY ("bomId") REFERENCES "boms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bom_lines" ADD CONSTRAINT "bom_lines_inputProductId_fkey" FOREIGN KEY ("inputProductId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_runs" ADD CONSTRAINT "production_runs_bomId_fkey" FOREIGN KEY ("bomId") REFERENCES "boms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_runs" ADD CONSTRAINT "production_runs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_inputs" ADD CONSTRAINT "production_inputs_runId_fkey" FOREIGN KEY ("runId") REFERENCES "production_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_inputs" ADD CONSTRAINT "production_inputs_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_outputs" ADD CONSTRAINT "production_outputs_runId_fkey" FOREIGN KEY ("runId") REFERENCES "production_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_outputs" ADD CONSTRAINT "production_outputs_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_work_challans" ADD CONSTRAINT "job_work_challans_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "parties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_work_challans" ADD CONSTRAINT "job_work_challans_linkedChallanId_fkey" FOREIGN KEY ("linkedChallanId") REFERENCES "job_work_challans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_work_challans" ADD CONSTRAINT "job_work_challans_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_work_challan_lines" ADD CONSTRAINT "job_work_challan_lines_challanId_fkey" FOREIGN KEY ("challanId") REFERENCES "job_work_challans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_work_challan_lines" ADD CONSTRAINT "job_work_challan_lines_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_ledger" ADD CONSTRAINT "stock_ledger_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_ledger" ADD CONSTRAINT "stock_ledger_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
