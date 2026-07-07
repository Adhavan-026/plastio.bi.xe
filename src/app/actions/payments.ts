"use server";

import { revalidatePath } from "next/cache";
import { getTenantDb, getTenantContext, requireRole } from "@/lib/tenant-db";
import { RecordPaymentFormSchema, type RecordPaymentFormState } from "@/lib/validations/payment";

export async function recordPayment(
  _state: RecordPaymentFormState,
  formData: FormData
): Promise<RecordPaymentFormState> {
  const context = await getTenantContext();
  requireRole(context, ["OWNER", "MANAGER", "CASHIER"]);

  const validatedFields = RecordPaymentFormSchema.safeParse(Object.fromEntries(formData));
  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { invoiceId, amount, mode, reference, notes } = validatedFields.data;

  const db = await getTenantDb();
  const invoice = await db.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) {
    return { message: "Invoice not found." };
  }

  const balanceDue = Number(invoice.totalAmount) - Number(invoice.amountPaid);
  if (amount > balanceDue) {
    return { errors: { amount: [`Amount can't exceed the balance due (₹${balanceDue.toFixed(2)}).`] } };
  }

  const newAmountPaid = Number(invoice.amountPaid) + amount;
  const paymentStatus =
    newAmountPaid <= 0 ? "UNPAID" : newAmountPaid >= Number(invoice.totalAmount) ? "PAID" : "PARTIAL";

  await db.$transaction(async (tx) => {
    await tx.payment.create({
      data: {
        tenantId: context.tenantId,
        invoiceId,
        partyId: invoice.partyId,
        amount,
        mode,
        reference: reference || null,
        notes: notes || null,
      },
    });

    await tx.invoice.update({
      where: { id: invoiceId },
      data: { amountPaid: newAmountPaid, paymentStatus },
    });
  });

  revalidatePath(`/dashboard/invoices/${invoiceId}`);
  revalidatePath("/dashboard/invoices");
  revalidatePath("/dashboard/purchases");
  revalidatePath("/dashboard/parties");
  return { message: "Payment recorded." };
}
