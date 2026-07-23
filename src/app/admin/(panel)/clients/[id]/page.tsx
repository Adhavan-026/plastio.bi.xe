import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { isSubscriptionActive, PLAN_LABELS } from "@/lib/billing/subscription";
import type { SubscriptionPlan } from "@/lib/enums";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { IssueSubscriptionForm } from "./issue-subscription-form";

export default async function AdminClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: {
      users: { where: { role: "OWNER" }, take: 1 },
      subscriptionIssues: {
        orderBy: { issuedAt: "desc" },
        include: { issuedByAdmin: { select: { name: true } } },
      },
    },
  });
  if (!tenant) notFound();

  const owner = tenant.users[0];
  const active = isSubscriptionActive(tenant);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin"
        className="text-muted-foreground hover:text-foreground flex w-fit items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" />
        All clients
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">{tenant.name}</h1>
        <Badge variant="secondary">{tenant.businessType}</Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="bg-card flex flex-col gap-3 rounded-xl border p-5 shadow-sm">
          <h2 className="text-sm font-bold">Shop profile</h2>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Owner</dt>
            <dd>{owner?.name ?? "—"}</dd>
            <dt className="text-muted-foreground">Owner email</dt>
            <dd className="truncate">{owner?.email ?? "—"}</dd>
            <dt className="text-muted-foreground">GST number</dt>
            <dd>{tenant.gstNumber ?? "—"}</dd>
            <dt className="text-muted-foreground">State</dt>
            <dd>{tenant.state ?? "—"}</dd>
            <dt className="text-muted-foreground">Phone</dt>
            <dd>{tenant.phone ?? "—"}</dd>
            <dt className="text-muted-foreground">Address</dt>
            <dd className="truncate">{tenant.address ?? "—"}</dd>
            <dt className="text-muted-foreground">Signed up</dt>
            <dd>{tenant.createdAt.toLocaleDateString("en-IN")}</dd>
          </dl>
        </div>

        <div className="bg-card flex flex-col gap-3 rounded-xl border p-5 shadow-sm">
          <h2 className="text-sm font-bold">Subscription status</h2>
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
              Never activated
            </Badge>
          )}
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Requested plan</dt>
            <dd>{tenant.requestedPlan ? PLAN_LABELS[tenant.requestedPlan as SubscriptionPlan] : "—"}</dd>
            <dt className="text-muted-foreground">Current plan</dt>
            <dd>{tenant.subscriptionPlan ? PLAN_LABELS[tenant.subscriptionPlan as SubscriptionPlan] : "—"}</dd>
            <dt className="text-muted-foreground">Keys redeemed</dt>
            <dd>
              {tenant.keysRedeemedAt ? tenant.keysRedeemedAt.toLocaleDateString("en-IN") : "Not yet"}
            </dd>
          </dl>
        </div>
      </div>

      <div className="bg-card flex flex-col gap-4 rounded-xl border p-5 shadow-sm">
        <div>
          <h2 className="text-sm font-bold">Issue a new subscription</h2>
          <p className="text-muted-foreground text-xs">
            Once the client has paid, pick a plan to generate a fresh License Key and Activation
            Code. Any previously issued keys stop working the moment new ones are issued.
          </p>
        </div>
        <IssueSubscriptionForm tenantId={tenant.id} />
      </div>

      <div className="bg-card overflow-hidden rounded-xl border shadow-sm">
        <div className="border-b px-5 py-3.5">
          <h2 className="text-sm font-bold">Subscription history</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plan</TableHead>
              <TableHead>Amount paid</TableHead>
              <TableHead>Issued</TableHead>
              <TableHead>Redeemed</TableHead>
              <TableHead>Issued by</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenant.subscriptionIssues.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground text-center">
                  No subscriptions issued yet.
                </TableCell>
              </TableRow>
            )}
            {tenant.subscriptionIssues.map((issue) => (
              <TableRow key={issue.id}>
                <TableCell>{PLAN_LABELS[issue.plan as SubscriptionPlan]}</TableCell>
                <TableCell>
                  {issue.amountPaid ? `₹${Number(issue.amountPaid).toFixed(2)}` : "—"}
                </TableCell>
                <TableCell>{issue.issuedAt.toLocaleDateString("en-IN")}</TableCell>
                <TableCell>
                  {issue.redeemedAt ? issue.redeemedAt.toLocaleDateString("en-IN") : "Not redeemed"}
                </TableCell>
                <TableCell>{issue.issuedByAdmin.name}</TableCell>
                <TableCell className="max-w-40 truncate">{issue.notes ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
