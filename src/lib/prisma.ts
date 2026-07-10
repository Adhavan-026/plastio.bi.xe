import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  // Supabase's pooler presents a cert chain with a self-signed root that
  // Node's default CA store doesn't trust. The connection is still
  // encrypted; this only skips chain-of-trust verification.
  ssl: { rejectUnauthorized: false },
  // The pooler is in a distant AWS region, so a fresh TCP+TLS+auth
  // handshake costs ~2s — far more than node-postgres' 10s default idle
  // timeout amortizes across typical request gaps. Keep pooled connections
  // warm much longer so most requests reuse one instead of paying that
  // cost repeatedly.
  keepAlive: true,
  idleTimeoutMillis: 5 * 60 * 1000,
});

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
