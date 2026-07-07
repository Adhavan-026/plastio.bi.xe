"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTenantDb, getTenantContext, requireRole } from "@/lib/tenant-db";
import { PartyFormSchema, type PartyFormState } from "@/lib/validations/party";

export async function createParty(
  _state: PartyFormState,
  formData: FormData
): Promise<PartyFormState> {
  const context = await getTenantContext();
  requireRole(context, ["OWNER", "MANAGER"]);

  const validatedFields = PartyFormSchema.safeParse(Object.fromEntries(formData));
  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const db = await getTenantDb();
  const { phone, email, address, state, gstNumber, ...rest } = validatedFields.data;
  await db.party.create({
    data: {
      ...rest,
      phone: phone || null,
      email: email || null,
      address: address || null,
      state: state || null,
      gstNumber: gstNumber || null,
      tenantId: context.tenantId,
    },
  });

  revalidatePath("/dashboard/parties");
  redirect("/dashboard/parties");
}

export async function updateParty(
  partyId: string,
  _state: PartyFormState,
  formData: FormData
): Promise<PartyFormState> {
  const context = await getTenantContext();
  requireRole(context, ["OWNER", "MANAGER"]);

  const validatedFields = PartyFormSchema.safeParse(Object.fromEntries(formData));
  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const db = await getTenantDb();
  const existing = await db.party.findUnique({ where: { id: partyId } });
  if (!existing) {
    return { message: "Party not found." };
  }

  const { phone, email, address, state, gstNumber, ...rest } = validatedFields.data;
  await db.party.update({
    where: { id: partyId },
    data: {
      ...rest,
      phone: phone || null,
      email: email || null,
      address: address || null,
      state: state || null,
      gstNumber: gstNumber || null,
    },
  });

  revalidatePath("/dashboard/parties");
  redirect("/dashboard/parties");
}
