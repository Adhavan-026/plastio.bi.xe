import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ADMIN_COOKIE_NAME, verifyAdminToken } from "@/lib/admin-session";

export async function getAdminSession() {
  const store = await cookies();
  const payload = verifyAdminToken(store.get(ADMIN_COOKIE_NAME)?.value);
  if (!payload) return null;

  return prisma.superAdmin.findUnique({
    where: { id: payload.id },
    select: { id: true, name: true, email: true },
  });
}

export async function requireAdminSession() {
  const admin = await getAdminSession();
  if (!admin) redirect("/admin/login");
  return admin;
}
