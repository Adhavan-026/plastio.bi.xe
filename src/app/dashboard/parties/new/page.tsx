import { createParty } from "@/app/actions/parties";
import { requireActiveSubscription } from "@/lib/billing/subscription";
import { BackButton } from "@/components/dashboard/back-button";
import { PartyForm } from "../party-form";

export default async function NewPartyPage() {
  await requireActiveSubscription();
  return (
    <div className="flex flex-col gap-6">
      <BackButton />
      <h1 className="text-2xl font-semibold">Add party</h1>
      <PartyForm action={createParty} submitLabel="Create party" />
    </div>
  );
}
