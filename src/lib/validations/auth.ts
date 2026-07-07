import * as z from "zod";

export const BUSINESS_TYPES = ["COMMON", "AGRO", "TYRE"] as const;

export const SignupFormSchema = z.object({
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
  password: z
    .string()
    .min(8, { error: "Password must be at least 8 characters." })
    .regex(/[a-zA-Z]/, { error: "Password must contain at least one letter." })
    .regex(/[0-9]/, { error: "Password must contain at least one number." }),
});

export type SignupFormState =
  | {
      errors?: {
        shopName?: string[];
        businessType?: string[];
        name?: string[];
        email?: string[];
        password?: string[];
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
