import { notFound } from "next/navigation";
import { getTenantDb } from "@/lib/tenant-db";
import { updateParty } from "@/app/actions/parties";
import { PartyForm } from "../../party-form";

export default async function EditPartyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await getTenantDb();
  const party = await db.party.findUnique({ where: { id } });

  if (!party) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Edit party</h1>
      <PartyForm
        action={updateParty.bind(null, party.id)}
        defaultValues={{
          name: party.name,
          type: party.type,
          phone: party.phone,
          email: party.email,
          address: party.address,
          state: party.state,
          gstNumber: party.gstNumber,
          openingBalance: party.openingBalance.toString(),
        }}
        submitLabel="Save changes"
      />
    </div>
  );
}
