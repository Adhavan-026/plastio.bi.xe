import * as z from "zod";
import { INDIAN_STATES } from "@/lib/validations/states";

export const BUSINESS_TYPES = ["COMMON", "AGRO", "TYRE"] as const;

// Optional fields that only render on some signup-wizard steps (e.g. the
// agro/tyre-only fields) arrive as FormData null when their step's input
// never mounted, and as "" when the field exists but was left blank —
// normalize both to undefined before validating.
const emptyToUndefined = (v: unknown) =>
  v === null || v === undefined || (typeof v === "string" && v.trim() === "") ? undefined : v;

const optionalTrimmed = z.preprocess(emptyToUndefined, z.string().trim().optional());

const optionalInt = z.preprocess(emptyToUndefined, z.coerce.number().int().positive().optional());

const PASSWORD_RULE = z
  .string()
  .min(8, { error: "Password must be at least 8 characters." })
  .regex(/[a-zA-Z]/, { error: "Password must contain at least one letter." })
  .regex(/[0-9]/, { error: "Password must contain at least one number." });

export const SignupFormSchema = z
  .object({
    shopName: z
      .string()
      .min(2, { error: "Shop name must be at least 2 characters." })
      .trim(),
    businessType: z.enum(BUSINESS_TYPES, {
      error: "Choose a business type.",
    }),
    name: z
      .string()
      .min(2, { error: "Your name must be at least 2 characters." })
      .trim(),
    email: z.email({ error: "Enter a valid email." }).trim(),
    password: PASSWORD_RULE,
    confirmPassword: z.string().min(1, { error: "Re-enter your password." }),
    state: z.enum(INDIAN_STATES, {
      error: "Select your shop's state.",
    }),
    gstNumber: optionalTrimmed,
    phone: optionalTrimmed,
    address: optionalTrimmed,
    licenseNumber: optionalTrimmed,
    defaultWarrantyMonths: optionalInt,
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "Passwords don't match.",
    path: ["confirmPassword"],
  });

export type SignupFormState =
  | {
      errors?: {
        shopName?: string[];
        businessType?: string[];
        name?: string[];
        email?: string[];
        password?: string[];
        confirmPassword?: string[];
        state?: string[];
        gstNumber?: string[];
        phone?: string[];
        address?: string[];
        licenseNumber?: string[];
        defaultWarrantyMonths?: string[];
      };
      message?: string;
    }
  | undefined;

export const LoginFormSchema = z.object({
  email: z.email({ error: "Enter a valid email." }).trim(),
  password: z.string().min(1, { error: "Password is required." }),
});

export type LoginFormState =
  | {
      errors?: {
        email?: string[];
        password?: string[];
      };
      message?: string;
    }
  | undefined;

export const ForgotPasswordSchema = z.object({
  email: z.email({ error: "Enter a valid email." }).trim(),
});

export type ForgotPasswordState =
  | {
      errors?: { email?: string[] };
      message?: string;
    }
  | undefined;

export const ResetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: PASSWORD_RULE,
    confirmPassword: z.string().min(1, { error: "Re-enter your password." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "Passwords don't match.",
    path: ["confirmPassword"],
  });

export type ResetPasswordState =
  | {
      errors?: { password?: string[]; confirmPassword?: string[] };
      message?: string;
      ok?: boolean;
    }
  | undefined;
