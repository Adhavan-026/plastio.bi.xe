import { getTenantContext } from "@/lib/tenant-db";
import { prisma } from "@/lib/prisma";
import { isSubscriptionActive } from "@/lib/billing/subscription";
import { BackButton } from "@/components/dashboard/back-button";
import { Badge } from "@/components/ui/badge";
import { ActivateForm } from "./activate-form";

export default async function ActivatePage() {
  const { tenantId } = await getTenantContext();
  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } });
  const active = isSubscriptionActive(tenant);

  return (
    <div className="flex flex-col gap-6">
      <BackButton />
      <div>
        <h1 className="text-2xl font-semibold">Activate your subscription</h1>
        <p className="text-muted-foreground text-sm">
          Enter the License Key and Activation Code you received after payment.
        </p>
      </div>

      {active ? (
        <Badge variant="success" className="w-fit">
          Active until {tenant.subscriptionExpiresAt!.toLocaleDateString("en-IN")}
        </Badge>
      ) : tenant.subscriptionExpiresAt ? (
        <Badge variant="destructive" className="w-fit">
          Expired {tenant.subscriptionExpiresAt.toLocaleDateString("en-IN")}
        </Badge>
      ) : (
        <Badge variant="secondary" className="w-fit">
          Not activated yet
        </Badge>
      )}

      <div className="bg-card max-w-lg rounded-xl border p-5 shadow-sm">
        <ActivateForm />
      </div>

      <p className="text-muted-foreground text-sm">
        Don&apos;t have keys yet, or need to renew? Contact us to arrange payment and receive your
        keys.
      </p>
    </div>
  );
}
