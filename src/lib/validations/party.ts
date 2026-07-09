import * as z from "zod";
import { INDIAN_STATES } from "@/lib/validations/states";

export const PARTY_TYPES = ["CUSTOMER", "SUPPLIER", "BOTH"] as const;

export const PartyFormSchema = z.object({
  name: z.string().min(1, { error: "Name is required." }).trim(),
  type: z.enum(PARTY_TYPES),
  phone: z.string().trim().optional().or(z.literal("")),
  email: z.email({ error: "Enter a valid email." }).trim().optional().or(z.literal("")),
  address: z.string().trim().optional().or(z.literal("")),
  // Required (not free text) — CGST+SGST vs IGST on every invoice depends on
  // this matching the shop's own state exactly, so it must come from a fixed list.
  state: z.enum(INDIAN_STATES, { error: "Select the party's state." }),
  gstNumber: z.string().trim().optional().or(z.literal("")),
  openingBalance: z.coerce.number({ error: "Opening balance must be a number." }),
});

export type PartyFormState =
  | {
      errors?: Partial<Record<keyof z.infer<typeof PartyFormSchema>, string[]>>;
      message?: string;
    }
  | undefined;

export const QuickPartySchema = z.object({
  name: z.string().min(1, { error: "Name is required." }).trim(),
  type: z.enum(PARTY_TYPES),
  phone: z.string().trim().optional().or(z.literal("")),
  state: z.enum(INDIAN_STATES, { error: "Select the party's state." }),
});

export type QuickPartyState =
  | {
      errors?: Partial<Record<keyof z.infer<typeof QuickPartySchema>, string[]>>;
      message?: string;
      party?: { id: string; name: string; state: string };
    }
  | undefined;
