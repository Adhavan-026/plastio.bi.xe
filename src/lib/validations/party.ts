import * as z from "zod";

export const PARTY_TYPES = ["CUSTOMER", "SUPPLIER", "BOTH"] as const;

export const PartyFormSchema = z.object({
  name: z.string().min(1, { error: "Name is required." }).trim(),
  type: z.enum(PARTY_TYPES),
  phone: z.string().trim().optional().or(z.literal("")),
  email: z.email({ error: "Enter a valid email." }).trim().optional().or(z.literal("")),
  address: z.string().trim().optional().or(z.literal("")),
  state: z.string().trim().optional().or(z.literal("")),
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
});

export type QuickPartyState =
  | {
      errors?: Partial<Record<keyof z.infer<typeof QuickPartySchema>, string[]>>;
      message?: string;
      party?: { id: string; name: string };
    }
  | undefined;
