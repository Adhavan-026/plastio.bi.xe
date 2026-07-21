-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "businessType" TEXT NOT NULL DEFAULT 'COMMON',
    "gstNumber" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "state" TEXT,
    "logoUrl" TEXT,
    "licenseNumber" TEXT,
    "defaultWarrantyMonths" INTEGER,
    "allowInvoiceEdit" BOOLEAN NOT NULL DEFAULT false,
    "invoiceEditWindowDays" INTEGER NOT NULL DEFAULT 7,
    "maxWastagePercent" DECIMAL NOT NULL DEFAULT 5,
    "licenseKey" TEXT,
    "activationCode" TEXT,
    "subscriptionPlan" TEXT,
    "subscriptionExpiresAt" DATETIME,
    "keysRedeemedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "super_admins" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "subscription_issues" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "licenseKey" TEXT NOT NULL,
    "activationCode" TEXT NOT NULL,
    "amountPaid" DECIMAL,
    "notes" TEXT,
    "issuedByAdminId" TEXT NOT NULL,
    "issuedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "redeemedAt" DATETIME,
    CONSTRAINT "subscription_issues_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "subscription_issues_issuedByAdminId_fkey" FOREIGN KEY ("issuedByAdminId") REFERENCES "super_admins" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'OWNER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "emailVerifiedAt" DATETIME,
    "emailVerifyToken" TEXT,
    "emailVerifyExpiresAt" DATETIME,
    "passwordResetToken" TEXT,
    "passwordResetExpiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hsnCode" TEXT,
    "unit" TEXT NOT NULL DEFAULT 'PCS',
    "gstRate" DECIMAL NOT NULL DEFAULT 0,
    "purchasePrice" DECIMAL NOT NULL DEFAULT 0,
    "sellingPrice" DECIMAL NOT NULL DEFAULT 0,
    "stockQty" DECIMAL NOT NULL DEFAULT 0,
    "lowStockAlert" DECIMAL NOT NULL DEFAULT 0,
    "category" TEXT,
    "categoryId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "tyreBrand" TEXT,
    "tyreSize" TEXT,
    "tyrePattern" TEXT,
    "tyreLoadIndex" TEXT,
    "stockCategory" TEXT NOT NULL DEFAULT 'TRADE',
    "wipQty" DECIMAL NOT NULL DEFAULT 0,
    "qtyWithJobWorker" DECIMAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "products_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "product_categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "product_price_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "purchasePrice" DECIMAL NOT NULL,
    "sellingPrice" DECIMAL NOT NULL,
    "changedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "product_price_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "product_price_logs_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "product_categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "product_categories_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "stock_batches" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "mfgDate" DATETIME,
    "expiryDate" DATETIME,
    "quantity" DECIMAL NOT NULL,
    "purchasePrice" DECIMAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "stock_batches_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "stock_batches_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "stock_adjustments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantityChange" DECIMAL NOT NULL,
    "reason" TEXT NOT NULL,
    "notes" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "stock_adjustments_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "stock_adjustments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "parties" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'CUSTOMER',
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "state" TEXT,
    "gstNumber" TEXT,
    "openingBalance" DECIMAL NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isJobWorker" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "parties_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "counters" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "counters_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "invoiceDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" DATETIME,
    "partyId" TEXT NOT NULL,
    "subtotal" DECIMAL NOT NULL DEFAULT 0,
    "discountAmount" DECIMAL NOT NULL DEFAULT 0,
    "taxableAmount" DECIMAL NOT NULL DEFAULT 0,
    "cgstAmount" DECIMAL NOT NULL DEFAULT 0,
    "sgstAmount" DECIMAL NOT NULL DEFAULT 0,
    "igstAmount" DECIMAL NOT NULL DEFAULT 0,
    "roundOff" DECIMAL NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL NOT NULL DEFAULT 0,
    "amountPaid" DECIMAL NOT NULL DEFAULT 0,
    "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID',
    "vehicleNumber" TEXT,
    "vehicleType" TEXT,
    "exchangeValue" DECIMAL NOT NULL DEFAULT 0,
    "notes" TEXT,
    "convertedFromId" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "invoices_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "parties" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "invoices_convertedFromId_fkey" FOREIGN KEY ("convertedFromId") REFERENCES "invoices" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "invoices_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "invoice_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "productId" TEXT,
    "description" TEXT NOT NULL,
    "hsnCode" TEXT,
    "batchId" TEXT,
    "tyreSerialNumber" TEXT,
    "warrantyMonths" INTEGER,
    "quantity" DECIMAL NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'PCS',
    "rate" DECIMAL NOT NULL,
    "discountPercent" DECIMAL NOT NULL DEFAULT 0,
    "discountAmount" DECIMAL NOT NULL DEFAULT 0,
    "gstRate" DECIMAL NOT NULL DEFAULT 0,
    "cgstAmount" DECIMAL NOT NULL DEFAULT 0,
    "sgstAmount" DECIMAL NOT NULL DEFAULT 0,
    "igstAmount" DECIMAL NOT NULL DEFAULT 0,
    "taxableAmount" DECIMAL NOT NULL,
    "totalAmount" DECIMAL NOT NULL,
    CONSTRAINT "invoice_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "invoice_items_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "stock_batches" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "invoice_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "partyId" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'CASH',
    "paymentDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reference" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "payments_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "parties" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "payments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "boms" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "outputProductId" TEXT NOT NULL,
    "outputQty" DECIMAL NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "boms_outputProductId_fkey" FOREIGN KEY ("outputProductId") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "boms_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "bom_lines" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "bomId" TEXT NOT NULL,
    "inputProductId" TEXT NOT NULL,
    "qty" DECIMAL NOT NULL,
    "wastagePercent" DECIMAL NOT NULL DEFAULT 0,
    CONSTRAINT "bom_lines_bomId_fkey" FOREIGN KEY ("bomId") REFERENCES "boms" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "bom_lines_inputProductId_fkey" FOREIGN KEY ("inputProductId") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "production_runs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "runNumber" TEXT NOT NULL,
    "bomId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "notes" TEXT,
    "yieldPercent" DECIMAL,
    "wastageExceeded" BOOLEAN NOT NULL DEFAULT false,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "production_runs_bomId_fkey" FOREIGN KEY ("bomId") REFERENCES "boms" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "production_runs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "production_inputs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "qty" DECIMAL NOT NULL,
    "unitCost" DECIMAL NOT NULL DEFAULT 0,
    CONSTRAINT "production_inputs_runId_fkey" FOREIGN KEY ("runId") REFERENCES "production_runs" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "production_inputs_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "production_outputs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "qty" DECIMAL NOT NULL,
    "outputType" TEXT NOT NULL DEFAULT 'FINISHED',
    CONSTRAINT "production_outputs_runId_fkey" FOREIGN KEY ("runId") REFERENCES "production_runs" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "production_outputs_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "job_work_challans" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "challanNumber" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedReturnDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "linkedChallanId" TEXT,
    "notes" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "job_work_challans_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "parties" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "job_work_challans_linkedChallanId_fkey" FOREIGN KEY ("linkedChallanId") REFERENCES "job_work_challans" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "job_work_challans_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "job_work_challan_lines" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "challanId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "qty" DECIMAL NOT NULL,
    "description" TEXT,
    CONSTRAINT "job_work_challan_lines_challanId_fkey" FOREIGN KEY ("challanId") REFERENCES "job_work_challans" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "job_work_challan_lines_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "stock_ledger" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "qty" DECIMAL NOT NULL,
    "bucket" TEXT NOT NULL DEFAULT 'ON_HAND',
    "reason" TEXT NOT NULL,
    "refType" TEXT NOT NULL,
    "refId" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "stock_ledger_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "stock_ledger_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_licenseKey_key" ON "tenants"("licenseKey");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_activationCode_key" ON "tenants"("activationCode");

-- CreateIndex
CREATE UNIQUE INDEX "super_admins_email_key" ON "super_admins"("email");

-- CreateIndex
CREATE INDEX "subscription_issues_tenantId_idx" ON "subscription_issues"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_emailVerifyToken_key" ON "users"("emailVerifyToken");

-- CreateIndex
CREATE UNIQUE INDEX "users_passwordResetToken_key" ON "users"("passwordResetToken");

-- CreateIndex
CREATE INDEX "users_tenantId_idx" ON "users"("tenantId");

-- CreateIndex
CREATE INDEX "products_tenantId_idx" ON "products"("tenantId");

-- CreateIndex
CREATE INDEX "products_categoryId_idx" ON "products"("categoryId");

-- CreateIndex
CREATE INDEX "product_price_logs_tenantId_idx" ON "product_price_logs"("tenantId");

-- CreateIndex
CREATE INDEX "product_price_logs_productId_idx" ON "product_price_logs"("productId");

-- CreateIndex
CREATE INDEX "product_categories_tenantId_idx" ON "product_categories"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "product_categories_tenantId_name_key" ON "product_categories"("tenantId", "name");

-- CreateIndex
CREATE INDEX "stock_batches_tenantId_idx" ON "stock_batches"("tenantId");

-- CreateIndex
CREATE INDEX "stock_batches_tenantId_productId_idx" ON "stock_batches"("tenantId", "productId");

-- CreateIndex
CREATE INDEX "stock_adjustments_tenantId_idx" ON "stock_adjustments"("tenantId");

-- CreateIndex
CREATE INDEX "stock_adjustments_tenantId_productId_idx" ON "stock_adjustments"("tenantId", "productId");

-- CreateIndex
CREATE INDEX "parties_tenantId_idx" ON "parties"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "counters_tenantId_key_key" ON "counters"("tenantId", "key");

-- CreateIndex
CREATE INDEX "invoices_tenantId_idx" ON "invoices"("tenantId");

-- CreateIndex
CREATE INDEX "invoices_tenantId_partyId_idx" ON "invoices"("tenantId", "partyId");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_tenantId_type_invoiceNumber_key" ON "invoices"("tenantId", "type", "invoiceNumber");

-- CreateIndex
CREATE INDEX "invoice_items_tenantId_idx" ON "invoice_items"("tenantId");

-- CreateIndex
CREATE INDEX "invoice_items_invoiceId_idx" ON "invoice_items"("invoiceId");

-- CreateIndex
CREATE INDEX "invoice_items_tenantId_tyreSerialNumber_idx" ON "invoice_items"("tenantId", "tyreSerialNumber");

-- CreateIndex
CREATE INDEX "payments_tenantId_idx" ON "payments"("tenantId");

-- CreateIndex
CREATE INDEX "payments_tenantId_invoiceId_idx" ON "payments"("tenantId", "invoiceId");

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

