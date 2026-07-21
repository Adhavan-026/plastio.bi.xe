import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { isDesktopMode } from "@/lib/deployment-mode";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Desktop: a single local SQLite file. In dev this defaults to a file
// alongside the schema; the packaged Electron app always sets
// DESKTOP_DB_PATH explicitly to a file inside app.getPath('userData') —
// never inside the installed app folder, which can be read-only or wiped
// on update (see electron/main.ts once that exists).
const desktopAdapter = () =>
  new PrismaBetterSqlite3({
    url: process.env.DESKTOP_DB_PATH ?? "./prisma/desktop-dev.db",
  });

// Cloud: unchanged from before — Supabase's pooler via node-postgres.
const cloudAdapter = () =>
  new PrismaPg({
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

const adapter = isDesktopMode ? desktopAdapter() : cloudAdapter();

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
