// Seeds one demo tenant with a full Production module scenario: a BOM
// (paddy -> rice + bran + husk, with wastage) and two production runs in
// different states, so the module is testable immediately after migration.
//
// This repo has no existing seed script — run with:
//   npm run seed:production-demo
// Safe to re-run — it removes any previous "Demo Rice Mill" tenant first.

import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const prisma = new PrismaClient({ adapter });

const TENANT_NAME = "Demo Rice Mill";
const LOGIN_EMAIL = "demo@ricemill.test";
const LOGIN_PASSWORD = "DemoRiceMill123";

async function removeExistingDemoTenant() {
  const existing = await prisma.tenant.findFirst({ where: { name: TENANT_NAME } });
  if (!existing) return;

  const tenantId = existing.id;
  // Same dependency-order deletion needed anywhere a tenant with
  // Production-module history is removed — Product's incoming FKs from
  // Bom/ProductionInput/ProductionOutput/JobWorkChallanLine/StockLedger
  // are onDelete: Restrict on purpose (protects production history from
  // accidental product deletion), so children must go before Product/Tenant.
  await prisma.jobWorkChallanLine.deleteMany({ where: { tenantId } });
  await prisma.jobWorkChallan.deleteMany({ where: { tenantId } });
  await prisma.productionOutput.deleteMany({ where: { tenantId } });
  await prisma.productionInput.deleteMany({ where: { tenantId } });
  await prisma.productionRun.deleteMany({ where: { tenantId } });
  await prisma.bomLine.deleteMany({ where: { tenantId } });
  await prisma.bom.deleteMany({ where: { tenantId } });
  await prisma.stockLedger.deleteMany({ where: { tenantId } });
  await prisma.tenant.delete({ where: { id: tenantId } });
}

async function main() {
  await removeExistingDemoTenant();

  const passwordHash = await bcrypt.hash(LOGIN_PASSWORD, 10);
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

  const tenant = await prisma.tenant.create({
    data: {
      name: TENANT_NAME,
      businessType: "COMMON",
      state: "Tamil Nadu",
      // Seeded/demo data only — bypasses the license-activation gate so
      // the module is explorable immediately, same as any local dev seed.
      subscriptionExpiresAt: oneYearFromNow,
      users: {
        create: {
          name: "Demo Owner",
          email: LOGIN_EMAIL,
          passwordHash,
          role: "OWNER",
          emailVerifiedAt: new Date(),
        },
      },
    },
  });

  const [paddy, rice, bran, husk, millingWastage] = await Promise.all([
    prisma.product.create({
      data: {
        tenantId: tenant.id,
        name: "Paddy",
        unit: "KG",
        stockCategory: "RAW",
        stockQty: 3000,
        purchasePrice: 22,
        sellingPrice: 0,
      },
    }),
    prisma.product.create({
      data: {
        tenantId: tenant.id,
        name: "Rice",
        unit: "KG",
        stockCategory: "FINISHED",
        purchasePrice: 40,
        sellingPrice: 55,
        gstRate: 5,
      },
    }),
    prisma.product.create({
      data: {
        tenantId: tenant.id,
        name: "Bran",
        unit: "KG",
        stockCategory: "BYPRODUCT",
        purchasePrice: 15,
        sellingPrice: 22,
        gstRate: 5,
      },
    }),
    prisma.product.create({
      data: {
        tenantId: tenant.id,
        name: "Husk",
        unit: "KG",
        stockCategory: "BYPRODUCT",
        purchasePrice: 3,
        sellingPrice: 6,
      },
    }),
    prisma.product.create({
      data: {
        tenantId: tenant.id,
        name: "Milling Wastage",
        unit: "KG",
        stockCategory: "BYPRODUCT",
      },
    }),
  ]);

  // BOM: standard batch is 500 kg paddy -> 330 kg rice (66% yield).
  const bom = await prisma.bom.create({
    data: {
      tenantId: tenant.id,
      name: "Paddy to Rice v1",
      outputProductId: rice.id,
      outputQty: 330,
      isActive: true,
      lines: {
        create: [{ tenantId: tenant.id, inputProductId: paddy.id, qty: 500, wastagePercent: 2 }],
      },
    },
  });

  // Run 1: COMPLETED, full paddy -> rice/bran/husk/wastage scenario, one
  // full batch (500 kg in, matching the BOM exactly). Left as-is so the
  // yield/wastage reports have something to show immediately.
  const run1 = await prisma.productionRun.create({
    data: {
      tenantId: tenant.id,
      runNumber: "RUN-DEMO-0001",
      bomId: bom.id,
      status: "DRAFT",
      createdByUserId: "seed-script",
      inputs: {
        create: [{ tenantId: tenant.id, productId: paddy.id, qty: 500, unitCost: paddy.purchasePrice }],
      },
    },
  });
  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id: paddy.id },
      data: { stockQty: { decrement: 500 }, wipQty: { increment: 500 } },
    });
    await tx.stockLedger.createMany({
      data: [
        { tenantId: tenant.id, productId: paddy.id, qty: -500, bucket: "ON_HAND", reason: "PRODUCTION_ISSUE", refType: "ProductionRun", refId: run1.id },
        { tenantId: tenant.id, productId: paddy.id, qty: 500, bucket: "WIP", reason: "PRODUCTION_ISSUE", refType: "ProductionRun", refId: run1.id },
      ],
    });
    await tx.productionRun.update({ where: { id: run1.id }, data: { status: "IN_PROGRESS", startedAt: new Date() } });
  });

  const run1Outputs = [
    { productId: rice.id, qty: 330, outputType: "FINISHED" },
    { productId: bran.id, qty: 40, outputType: "BYPRODUCT" },
    { productId: husk.id, qty: 100, outputType: "BYPRODUCT" },
    { productId: millingWastage.id, qty: 30, outputType: "WASTAGE" },
  ];
  await prisma.$transaction(async (tx) => {
    await tx.product.update({ where: { id: paddy.id }, data: { wipQty: { decrement: 500 } } });
    await tx.product.update({ where: { id: rice.id }, data: { stockQty: { increment: 330 } } });
    await tx.product.update({ where: { id: bran.id }, data: { stockQty: { increment: 40 } } });
    await tx.product.update({ where: { id: husk.id }, data: { stockQty: { increment: 100 } } });
    await tx.stockLedger.createMany({
      data: [
        { tenantId: tenant.id, productId: paddy.id, qty: -500, bucket: "WIP", reason: "PRODUCTION_OUTPUT", refType: "ProductionRun", refId: run1.id },
        { tenantId: tenant.id, productId: rice.id, qty: 330, bucket: "ON_HAND", reason: "PRODUCTION_OUTPUT", refType: "ProductionRun", refId: run1.id },
        { tenantId: tenant.id, productId: bran.id, qty: 40, bucket: "ON_HAND", reason: "PRODUCTION_OUTPUT", refType: "ProductionRun", refId: run1.id },
        { tenantId: tenant.id, productId: husk.id, qty: 100, bucket: "ON_HAND", reason: "PRODUCTION_OUTPUT", refType: "ProductionRun", refId: run1.id },
      ],
    });
    await tx.productionOutput.createMany({
      data: run1Outputs.map((o) => ({ tenantId: tenant.id, runId: run1.id, ...o })),
    });
    await tx.productionRun.update({
      where: { id: run1.id },
      data: { status: "COMPLETED", completedAt: new Date(), yieldPercent: 66, wastageExceeded: true },
    });
  });

  // Run 2: left IN_PROGRESS on purpose (smaller half-batch, 250 kg paddy
  // issued) so a developer can immediately try the "complete run" flow
  // themselves instead of only seeing finished history.
  const run2 = await prisma.productionRun.create({
    data: {
      tenantId: tenant.id,
      runNumber: "RUN-DEMO-0002",
      bomId: bom.id,
      status: "DRAFT",
      createdByUserId: "seed-script",
      inputs: { create: [{ tenantId: tenant.id, productId: paddy.id, qty: 250, unitCost: paddy.purchasePrice }] },
    },
  });
  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id: paddy.id },
      data: { stockQty: { decrement: 250 }, wipQty: { increment: 250 } },
    });
    await tx.stockLedger.createMany({
      data: [
        { tenantId: tenant.id, productId: paddy.id, qty: -250, bucket: "ON_HAND", reason: "PRODUCTION_ISSUE", refType: "ProductionRun", refId: run2.id },
        { tenantId: tenant.id, productId: paddy.id, qty: 250, bucket: "WIP", reason: "PRODUCTION_ISSUE", refType: "ProductionRun", refId: run2.id },
      ],
    });
    await tx.productionRun.update({ where: { id: run2.id }, data: { status: "IN_PROGRESS", startedAt: new Date() } });
  });

  // A job worker + one open outward challan, so Job Work has something to
  // show too (bran sent out for repackaging, still pending).
  const jobWorker = await prisma.party.create({
    data: { tenantId: tenant.id, name: "Sundaram Packaging Works", type: "SUPPLIER", isJobWorker: true, state: "Tamil Nadu" },
  });
  const expectedReturn = new Date();
  expectedReturn.setDate(expectedReturn.getDate() + 5);
  const challan = await prisma.jobWorkChallan.create({
    data: {
      tenantId: tenant.id,
      challanNumber: "JWC-DEMO-0001",
      partyId: jobWorker.id,
      direction: "OUTWARD",
      status: "OPEN",
      expectedReturnDate: expectedReturn,
      createdByUserId: "seed-script",
      lines: { create: [{ tenantId: tenant.id, productId: bran.id, qty: 20, description: "For repackaging into 5kg bags" }] },
    },
  });
  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id: bran.id },
      data: { stockQty: { decrement: 20 }, qtyWithJobWorker: { increment: 20 } },
    });
    await tx.stockLedger.createMany({
      data: [
        { tenantId: tenant.id, productId: bran.id, qty: -20, bucket: "ON_HAND", reason: "JOB_WORK_OUT", refType: "JobWorkChallan", refId: challan.id },
        { tenantId: tenant.id, productId: bran.id, qty: 20, bucket: "WITH_JOB_WORKER", reason: "JOB_WORK_OUT", refType: "JobWorkChallan", refId: challan.id },
      ],
    });
  });

  console.log("Seeded Production module demo data.");
  console.log(`  Tenant:   ${TENANT_NAME}`);
  console.log(`  Login:    ${LOGIN_EMAIL} / ${LOGIN_PASSWORD}`);
  console.log(`  BOM:      ${bom.name} (paddy -> rice/bran/husk/wastage)`);
  console.log(`  Runs:     ${run1.runNumber} (COMPLETED, 66% yield, wastage flagged)`);
  console.log(`            ${run2.runNumber} (IN_PROGRESS — try completing it)`);
  console.log(`  Job work: ${challan.challanNumber} (OPEN, 20kg bran with ${jobWorker.name})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
