import { getTenantContext, getTenantDb } from "@/lib/tenant-db";
import { prisma } from "@/lib/prisma";
import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const { tenantId, role } = await getTenantContext();
  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } });

  const db = await getTenantDb();
  const teamSize = await db.user.count();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{tenant.name}</h1>
          <p className="text-muted-foreground text-sm">
            {tenant.businessType} shop &middot; signed in as {role}
          </p>
        </div>
        <form action={logout}>
          <Button variant="outline" type="submit">
            Log out
          </Button>
        </form>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Phase 0 foundation is live</CardTitle>
          <CardDescription>
            Auth, multi-tenant scoping, and the database are wired up. Billing
            features land in Phase 1.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm">
          <p>Team members in your shop: {teamSize}</p>
        </CardContent>
      </Card>
    </div>
  );
}
