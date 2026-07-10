"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getTenantContext, requireRole } from "@/lib/tenant-db";
import { TenantSettingsSchema, type TenantSettingsState } from "@/lib/validations/settings";

export async function updateTenantSettings(
  _state: TenantSettingsState,
  formData: FormData
): Promise<TenantSettingsState> {
  const context = await getTenantContext();
  requireRole(context, ["OWNER", "MANAGER"]);

  const validatedFields = TenantSettingsSchema.safeParse(Object.fromEntries(formData));
  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const {
    name,
    gstNumber,
    phone,
    email,
    address,
    state,
    licenseNumber,
    logoUrl,
    allowInvoiceEdit,
    invoiceEditWindowDays,
  } = validatedFields.data;

  // Tenant is identified by its own id (== context.tenantId), not a
  // tenantId foreign key, so it's updated via the raw client rather than
  // getTenantDb() — the scoping guarantee here is that context.tenantId
  // came from the verified session, not client input.
  await prisma.tenant.update({
    where: { id: context.tenantId },
    data: {
      name,
      gstNumber: gstNumber || null,
      phone: phone || null,
      email: email || null,
      address: address || null,
      state,
      licenseNumber: licenseNumber || null,
      ...(logoUrl !== undefined ? { logoUrl: logoUrl || null } : {}),
      // Only the owner may change the invoice-editing policy; managers'
      // submissions (which don't render these fields anyway) leave it alone.
      ...(context.role === "OWNER" && allowInvoiceEdit !== undefined
        ? { allowInvoiceEdit: allowInvoiceEdit === "true" }
        : {}),
      ...(context.role === "OWNER" && invoiceEditWindowDays !== undefined
        ? { invoiceEditWindowDays }
        : {}),
    },
  });

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  return { message: "Settings saved." };
}
