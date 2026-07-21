import "server-only";
import { randomUUID } from "crypto";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/lib/enums";

// Desktop mode has exactly one shop and one user — there's no login, so
// there's nothing to key a lookup on except a fixed, well-known email.
// Never used to authenticate (desktop mode never calls NextAuth's
// authorize()); the random passwordHash just satisfies the NOT NULL column.
const DESKTOP_OWNER_EMAIL = "owner@clickone.local";

type DesktopIdentity = {
  userId: string;
  tenantId: string;
  role: Role;
  name: string;
  email: string;
};

// Memoized per server process. Electron's main process runs exactly one
// Next.js server for the app's lifetime, so this only ever hits the
// database once per launch (first request after that just reads the cache).
let cached: Promise<DesktopIdentity> | null = null;

export async function getDesktopIdentity(): Promise<DesktopIdentity> {
  // better-sqlite3 is synchronous, so without this, `next build`'s static
  // prerendering pass would run this query (and its DB file wouldn't even
  // exist yet — it's created on first real launch, not at build time).
  // See node_modules/next/dist/docs/.../functions/connection.md.
  await connection();

  if (!cached) {
    cached = loadOrCreateDesktopIdentity().catch((error) => {
      // Don't cache a failed attempt — a transient DB error on first run
      // shouldn't permanently wedge every request for the rest of the process.
      cached = null;
      throw error;
    });
  }
  return cached;
}

async function loadOrCreateDesktopIdentity(): Promise<DesktopIdentity> {
  const existing = await prisma.user.findFirst({
    where: { email: DESKTOP_OWNER_EMAIL },
    select: { id: true, tenantId: true, role: true, name: true, email: true },
  });
  if (existing) {
    return {
      userId: existing.id,
      tenantId: existing.tenantId,
      role: existing.role as Role,
      name: existing.name,
      email: existing.email,
    };
  }

  const tenant = await prisma.tenant.create({
    data: {
      name: "My Shop",
      businessType: "COMMON",
      users: {
        create: {
          name: "Owner",
          email: DESKTOP_OWNER_EMAIL,
          passwordHash: randomUUID(),
          role: "OWNER",
          emailVerifiedAt: new Date(),
        },
      },
    },
    include: { users: true },
  });

  const owner = tenant.users[0]!;
  return {
    userId: owner.id,
    tenantId: tenant.id,
    role: owner.role as Role,
    name: owner.name,
    email: owner.email,
  };
}
