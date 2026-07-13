-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('DAILY', 'MONTHLY', 'YEARLY');

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "licenseKey" TEXT,
ADD COLUMN     "activationCode" TEXT,
ADD COLUMN     "subscriptionPlan" "SubscriptionPlan",
ADD COLUMN     "subscriptionExpiresAt" TIMESTAMP(3),
ADD COLUMN     "keysRedeemedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "super_admins" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "super_admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_issues" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL,
    "licenseKey" TEXT NOT NULL,
    "activationCode" TEXT NOT NULL,
    "amountPaid" DECIMAL(12,2),
    "notes" TEXT,
    "issuedByAdminId" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "redeemedAt" TIMESTAMP(3),

    CONSTRAINT "subscription_issues_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_licenseKey_key" ON "tenants"("licenseKey");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_activationCode_key" ON "tenants"("activationCode");

-- CreateIndex
CREATE UNIQUE INDEX "super_admins_email_key" ON "super_admins"("email");

-- CreateIndex
CREATE INDEX "subscription_issues_tenantId_idx" ON "subscription_issues"("tenantId");

-- AddForeignKey
ALTER TABLE "subscription_issues" ADD CONSTRAINT "subscription_issues_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_issues" ADD CONSTRAINT "subscription_issues_issuedByAdminId_fkey" FOREIGN KEY ("issuedByAdminId") REFERENCES "super_admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
