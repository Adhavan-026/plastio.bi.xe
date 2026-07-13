import Link from "next/link";
import { LogOut } from "lucide-react";
import { requireAdminSession } from "@/lib/admin-auth";
import { adminLogout } from "@/app/actions/admin-auth";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdminSession();

  return (
    <div className="flex min-h-full flex-col">
      <header className="bg-card sticky top-0 z-20 flex items-center justify-between border-b px-5 py-3.5 shadow-xs">
        <Link href="/admin" className="flex items-center gap-2.5">
          <Logo className="h-6 w-auto" />
          <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            Admin
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground hidden text-sm sm:inline">{admin.name}</span>
          <form action={adminLogout}>
            <Button type="submit" variant="ghost" size="sm">
              <LogOut />
              Log out
            </Button>
          </form>
        </div>
      </header>
      <div className="mx-auto w-full max-w-6xl min-w-0 flex-1 p-6">{children}</div>
    </div>
  );
}
