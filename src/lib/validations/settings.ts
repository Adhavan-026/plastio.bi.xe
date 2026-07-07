import * as z from "zod";

export const TenantSettingsSchema = z.object({
  name: z.string().min(1, { error: "Shop name is required." }).trim(),
  gstNumber: z.string().trim().optional().or(z.literal("")),
  phone: z.string().trim().optional().or(z.literal("")),
  email: z.email({ error: "Enter a valid email." }).trim().optional().or(z.literal("")),
  address: z.string().trim().optional().or(z.literal("")),
  state: z.string().trim().optional().or(z.literal("")),
});

export type TenantSettingsState =
  | {
      errors?: Partial<Record<keyof z.infer<typeof TenantSettingsSchema>, string[]>>;
      message?: string;
    }
  | undefined;
