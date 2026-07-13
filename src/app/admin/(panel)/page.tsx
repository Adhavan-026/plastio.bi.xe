import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PAGE_SIZE, resolvePage, totalPages as computeTotalPages } from "@/lib/pagination";
import { isSubscriptionActive } from "@/lib/billing/subscription";
import { SearchBar } from "@/components/list/search-bar";
import { ListPagination } from "@/components/list/list-pagination";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function statusBadge(tenant: { subscriptionExpiresAt: Date | null }) {
  if (!tenant.subscriptionExpiresAt) {
    return <Badge variant="secondary">Not activated</Badge>;
  }
  if (isSubscriptionActive(tenant)) {
    return (
      <Badge variant="success">
        Active until {tenant.subscriptionExpiresAt.toLocaleDateString("en-IN")}
      </Badge>
    );
  }
  return (
    <Badge variant="destructive">
      Expired {tenant.subscriptionExpiresAt.toLocaleDateString("en-IN")}
    </Badge>
  );
}

export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const page = resolvePage(params);

  const where = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { users: { some: { email: { contains: q, mode: "insensitive" as const } } } },
        ],
      }
    : {};

  const [tenants, count] = await Promise.all([
    prisma.tenant.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        businessType: true,
        state: true,
        createdAt: true,
        subscriptionExpiresAt: true,
        users: {
          where: { role: "OWNER" },
          take: 1,
          select: { name: true, email: true },
        },
      },
    }),
    prisma.tenant.count({ where }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Client shops</h1>
        <p className="text-muted-foreground text-sm">
          Every shop that has signed up, and its subscription status.
        </p>
      </div>

      <SearchBar placeholder="Search by shop name or owner email..." defaultValue={q} />

      <div className="bg-card overflow-hidden rounded-xl border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Shop</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Signed up</TableHead>
              <TableHead>Subscription</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground text-center">
                  {q ? `No shops match "${q}".` : "No shops have signed up yet."}
                </TableCell>
              </TableRow>
            )}
            {tenants.map((tenant) => (
              <TableRow key={tenant.id}>
                <TableCell className="font-medium">{tenant.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{tenant.businessType}</Badge>
                </TableCell>
                <TableCell>
                  {tenant.users[0] ? (
                    <div className="flex flex-col leading-tight">
                      <span className="text-sm">{tenant.users[0].name}</span>
                      <span className="text-muted-foreground text-xs">{tenant.users[0].email}</span>
                    </div>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>{tenant.createdAt.toLocaleDateString("en-IN")}</TableCell>
                <TableCell>{statusBadge(tenant)}</TableCell>
                <TableCell>
                  <Link
                    href={`/admin/clients/${tenant.id}`}
                    className="text-primary text-sm font-semibold hover:underline"
                  >
                    Manage →
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ListPagination page={page} totalPages={computeTotalPages(count)} searchParams={params} />
    </div>
  );
}
