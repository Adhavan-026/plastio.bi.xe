-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "allowInvoiceEdit" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "invoiceEditWindowDays" INTEGER NOT NULL DEFAULT 7;
