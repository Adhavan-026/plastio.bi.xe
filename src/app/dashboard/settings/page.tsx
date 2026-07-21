import { getTenantContext } from "@/lib/tenant-db";
import { prisma } from "@/lib/prisma";
import { isDesktopMode } from "@/lib/deployment-mode";
import { FontSizeControl } from "@/components/settings/font-size-control";
import { DesktopBackupPanel } from "@/components/settings/desktop-backup-panel";
import { BackButton } from "@/components/dashboard/back-button";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const { tenantId, role } = await getTenantContext();
  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } });

  return (
    <div className="flex flex-col gap-6">
      <BackButton />
      <div>
        <h1 className="text-2xl font-semibold">Shop settings</h1>
        <p className="text-muted-foreground text-sm">
          Business type: {tenant.businessType} (contact support to change)
        </p>
      </div>
      <FontSizeControl />
      {isDesktopMode && <DesktopBackupPanel />}
      <SettingsForm
        defaultValues={{
          name: tenant.name,
          gstNumber: tenant.gstNumber,
          phone: tenant.phone,
          email: tenant.email,
          address: tenant.address,
          state: tenant.state,
          licenseNumber: tenant.licenseNumber,
          logoUrl: tenant.logoUrl,
          allowInvoiceEdit: tenant.allowInvoiceEdit,
          invoiceEditWindowDays: tenant.invoiceEditWindowDays,
        }}
        showLicenseNumber={tenant.businessType === "AGRO"}
        isOwner={role === "OWNER"}
      />
    </div>
  );
}
