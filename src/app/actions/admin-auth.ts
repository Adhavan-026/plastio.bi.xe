"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ADMIN_COOKIE_NAME, createAdminToken } from "@/lib/admin-session";
import { AdminLoginFormSchema, type AdminLoginFormState } from "@/lib/validations/admin-auth";

export async function adminLogin(
  _state: AdminLoginFormState,
  formData: FormData
): Promise<AdminLoginFormState> {
  const validatedFields = AdminLoginFormSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { email, password } = validatedFields.data;

  const admin = await prisma.superAdmin.findUnique({ where: { email } });
  if (!admin) {
    return { message: "Invalid email or password." };
  }

  const isValid = await bcrypt.compare(password, admin.passwordHash);
  if (!isValid) {
    return { message: "Invalid email or password." };
  }

  const store = await cookies();
  store.set(ADMIN_COOKIE_NAME, createAdminToken(admin.id), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 12,
  });

  redirect("/admin");
}

export async function adminLogout() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE_NAME);
  redirect("/admin/login");
}
