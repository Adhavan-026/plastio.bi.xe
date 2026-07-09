"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTenantDb, getTenantContext, requireRole } from "@/lib/tenant-db";
import {
  PartyFormSchema,
  QuickPartySchema,
  type PartyFormState,
  type QuickPartyState,
} from "@/lib/validations/party";
import { INDIAN_STATES } from "@/lib/validations/states";

/**
 * Fixes up a party's state in place from the billing screen, for parties
 * created before state was required (they'd otherwise silently default to
 * intra-state CGST+SGST with no indication why). Doesn't redirect, same
 * reasoning as quickCreateParty.
 */
export async function updatePartyState(
  partyId: string,
  state: string
): Promise<{ ok: boolean; message?: string }> {
  const context = await getTenantContext();
  requireRole(context, ["OWNER", "MANAGER", "CASHIER"]);

  const result = z.enum(INDIAN_STATES).safeParse(state);
  if (!result.success) {
    return { ok: false, message: "Select a valid state." };
  }

  const db = await getTenantDb();
  const existing = await db.party.findUnique({ where: { id: partyId } });
  if (!existing) {
    return { ok: false, message: "Party not found." };
  }

  await db.party.update({ where: { id: partyId }, data: { state: result.data } });
  revalidatePath("/dashboard/parties");
  return { ok: true };
}

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
