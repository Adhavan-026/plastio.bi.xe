import * as z from "zod";
import { INDIAN_STATES } from "@/lib/validations/states";

export const TenantSettingsSchema = z.object({
  name: z.string().min(1, { error: "Shop name is required." }).trim(),
  gstNumber: z.string().trim().optional().or(z.literal("")),
  phone: z.string().trim().optional().or(z.literal("")),
  email: z.email({ error: "Enter a valid email." }).trim().optional().or(z.literal("")),
  address: z.string().trim().optional().or(z.literal("")),
  // Data URL of a client-resized logo image (see LogoUpload). Capped well
  // above what a resized-to-160px PNG/JPEG needs, to block abuse.
  logoUrl: z
    .string()
    .trim()
    .refine((v) => v === "" || v.startsWith("data:image/"), {
      error: "Logo must be an image.",
    })
    .refine((v) => v.length <= 400_000, { error: "Logo image is too large." })
    .optional()
    .or(z.literal("")),
  // Required (not free text) — CGST+SGST vs IGST on every invoice depends on
  // this matching a party's state exactly, so it must come from a fixed list.
  state: z.enum(INDIAN_STATES, { error: "Select the shop's state." }),
  licenseNumber: z.string().trim().optional().or(z.literal("")),
  // Owner-only fields, absent from the form for other roles (the action
  // ignores them unless the caller is OWNER regardless).
  allowInvoiceEdit: z.enum(["true", "false"]).optional(),
  invoiceEditWindowDays: z.coerce
    .number()
    .int({ error: "Days must be a whole number." })
    .min(1, { error: "Must allow at least 1 day." })
    .max(365, { error: "Can't exceed 365 days." })
    .optional(),
});

export type TenantSettingsState =
  | {
      errors?: Partial<Record<keyof z.infer<typeof TenantSettingsSchema>, string[]>>;
      message?: string;
    }
  | undefined;
