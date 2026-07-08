import { getTenantContext } from "@/lib/tenant-db";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const { tenantId } = await getTenantContext();
  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Shop settings</h1>
        <p className="text-muted-foreground text-sm">
          Business type: {tenant.businessType} (contact support to change)
        </p>
      </div>
      <SettingsForm
        defaultValues={{
          name: tenant.name,
          gstNumber: tenant.gstNumber,
          phone: tenant.phone,
          email: tenant.email,
          address: tenant.address,
          state: tenant.state,
          licenseNumber: tenant.licenseNumber,
        }}
        showLicenseNumber={tenant.businessType === "AGRO"}
      />
    </div>
  );
}
