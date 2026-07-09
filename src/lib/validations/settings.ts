import * as z from "zod";
import { INDIAN_STATES } from "@/lib/validations/states";

export const TenantSettingsSchema = z.object({
  name: z.string().min(1, { error: "Shop name is required." }).trim(),
  gstNumber: z.string().trim().optional().or(z.literal("")),
  phone: z.string().trim().optional().or(z.literal("")),
  email: z.email({ error: "Enter a valid email." }).trim().optional().or(z.literal("")),
  address: z.string().trim().optional().or(z.literal("")),
  // Required (not free text) — CGST+SGST vs IGST on every invoice depends on
  // this matching a party's state exactly, so it must come from a fixed list.
  state: z.enum(INDIAN_STATES, { error: "Select the shop's state." }),
  licenseNumber: z.string().trim().optional().or(z.literal("")),
});

export type TenantSettingsState =
  | {
      errors?: Partial<Record<keyof z.infer<typeof TenantSettingsSchema>, string[]>>;
      message?: string;
    }
  | undefined;
