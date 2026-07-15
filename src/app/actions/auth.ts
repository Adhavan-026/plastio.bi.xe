"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant-db";
import { sendEmail } from "@/lib/email";
import { generateAuthToken, PASSWORD_RESET_TTL_MS, EMAIL_VERIFY_TTL_MS } from "@/lib/auth-tokens";
import {
  LoginFormSchema,
  type LoginFormState,
  SignupFormSchema,
  type SignupFormState,
  ForgotPasswordSchema,
  type ForgotPasswordState,
  ResetPasswordSchema,
  type ResetPasswordState,
} from "@/lib/validations/auth";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function verifyEmailLink(token: string): string {
  return `${APP_URL}/verify-email?token=${token}`;
}
function resetPasswordLink(token: string): string {
  return `${APP_URL}/reset-password?token=${token}`;
}

export async function signup(
  _state: SignupFormState,
  formData: FormData
): Promise<SignupFormState> {
  const validatedFields = SignupFormSchema.safeParse({
    shopName: formData.get("shopName"),
    businessType: formData.get("businessType"),
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    state: formData.get("state"),
    gstNumber: formData.get("gstNumber"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    licenseNumber: formData.get("licenseNumber"),
    defaultWarrantyMonths: formData.get("defaultWarrantyMonths"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const {
    shopName,
    businessType,
    name,
    email,
    password,
    state,
    gstNumber,
    phone,
    address,
    licenseNumber,
    defaultWarrantyMonths,
  } = validatedFields.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { errors: { email: ["An account with this email already exists."] } };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const emailVerifyToken = generateAuthToken();

  await prisma.tenant.create({
    data: {
      name: shopName,
      businessType,
      state,
      gstNumber,
      phone,
      address,
      licenseNumber: businessType === "AGRO" ? licenseNumber : undefined,
      defaultWarrantyMonths: businessType === "TYRE" ? defaultWarrantyMonths : undefined,
      users: {
        create: {
          name,
          email,
          passwordHash,
          role: "OWNER",
          emailVerifyToken,
          emailVerifyExpiresAt: new Date(Date.now() + EMAIL_VERIFY_TTL_MS),
        },
      },
    },
  });

  // Best-effort — a broken email provider shouldn't block account creation.
  await sendEmail({
    to: email,
    subject: "Verify your email — Plastio.xe",
    html: `<p>Hi ${name},</p><p>Welcome to Plastio.xe. Please verify your email address:</p><p><a href="${verifyEmailLink(emailVerifyToken)}">Verify email</a></p><p>This link expires in 24 hours.</p>`,
  }).catch(() => {});

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { message: "Account created, but sign-in failed. Please log in." };
    }
    throw error;
  }
}

export async function login(
  _state: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  const validatedFields = LoginFormSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { email, password } = validatedFields.data;

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { message: "Invalid email or password." };
    }
    throw error;
  }
}

export async function logout() {
  await signOut({ redirectTo: "/login" });
}

// Always returns the same generic message regardless of whether the email
// matches an account — confirming/denying an email's existence here would
// let anyone enumerate registered shop owners.
export async function requestPasswordReset(
  _state: ForgotPasswordState,
  formData: FormData
): Promise<ForgotPasswordState> {
  const validatedFields = ForgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { email } = validatedFields.data;
  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    const passwordResetToken = generateAuthToken();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken,
        passwordResetExpiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
      },
    });
    await sendEmail({
      to: email,
      subject: "Reset your password — Plastio.xe",
      html: `<p>Hi ${user.name},</p><p>Reset your password:</p><p><a href="${resetPasswordLink(passwordResetToken)}">Reset password</a></p><p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>`,
    }).catch(() => {});
  }

  return { message: "If that email has an account, we've sent a password reset link." };
}

export async function resetPassword(
  _state: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  const validatedFields = ResetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { token, password } = validatedFields.data;
  const user = await prisma.user.findUnique({ where: { passwordResetToken: token } });
  if (!user || !user.passwordResetExpiresAt || user.passwordResetExpiresAt < new Date()) {
    return { message: "This reset link is invalid or has expired. Request a new one." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, passwordResetToken: null, passwordResetExpiresAt: null },
  });

  return { ok: true, message: "Password reset — log in with your new password." };
}

export async function verifyEmail(token: string): Promise<{ ok: boolean; message: string }> {
  const user = await prisma.user.findUnique({ where: { emailVerifyToken: token } });
  if (!user || !user.emailVerifyExpiresAt || user.emailVerifyExpiresAt < new Date()) {
    return { ok: false, message: "This verification link is invalid or has expired." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerifiedAt: new Date(), emailVerifyToken: null, emailVerifyExpiresAt: null },
  });

  return { ok: true, message: "Your email is verified." };
}

export async function resendVerificationEmail(): Promise<{ ok: boolean; message: string }> {
  const context = await getTenantContext();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: context.userId } });

  if (user.emailVerifiedAt) {
    return { ok: true, message: "Your email is already verified." };
  }

  const emailVerifyToken = generateAuthToken();
  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerifyToken, emailVerifyExpiresAt: new Date(Date.now() + EMAIL_VERIFY_TTL_MS) },
  });

  await sendEmail({
    to: user.email,
    subject: "Verify your email — Plastio.xe",
    html: `<p>Hi ${user.name},</p><p>Verify your email address:</p><p><a href="${verifyEmailLink(emailVerifyToken)}">Verify email</a></p><p>This link expires in 24 hours.</p>`,
  }).catch(() => {});

  return { ok: true, message: "Verification email sent — check your inbox." };
}
