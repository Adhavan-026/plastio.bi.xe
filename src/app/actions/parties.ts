"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTenantDb, getTenantContext, requireRole } from "@/lib/tenant-db";
import {
  PartyFormSchema,
  QuickPartySchema,
  type PartyFormState,
  type QuickPartyState,
} from "@/lib/validations/party";

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
      state,
      gstNumber: gstNumber || null,
      tenantId: context.tenantId,
    },
  });

  revalidatePath("/dashboard/parties");
  redirect("/dashboard/parties");
}

/**
 * Creates a minimal party without redirecting, for the invoice screen's
 * quick-add dialog — losing in-progress billing to a navigation would
 * defeat the point of speeding up the billing flow.
 */
export async function quickCreateParty(
  _state: QuickPartyState,
  formData: FormData
): Promise<QuickPartyState> {
  const context = await getTenantContext();
  requireRole(context, ["OWNER", "MANAGER", "CASHIER"]);

  const validatedFields = QuickPartySchema.safeParse(Object.fromEntries(formData));
  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const db = await getTenantDb();
  const { phone, ...rest } = validatedFields.data;
  const party = await db.party.create({
    data: {
      ...rest,
      phone: phone || null,
      openingBalance: 0,
      tenantId: context.tenantId,
    },
  });

  revalidatePath("/dashboard/parties");
  return { party: { id: party.id, name: party.name, state: party.state as string } };
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
      state,
      gstNumber: gstNumber || null,
    },
  });

  revalidatePath("/dashboard/parties");
  redirect("/dashboard/parties");
}
