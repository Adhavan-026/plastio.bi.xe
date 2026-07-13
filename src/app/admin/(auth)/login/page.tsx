import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { AdminLoginForm } from "./admin-login-form";

export default function AdminLoginPage() {
  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6">
      <div className="flex flex-col items-center gap-1.5">
        <Logo className="h-8 w-auto" />
        <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          Admin
        </span>
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Super Admin sign in</CardTitle>
          <CardDescription>Manage client shops and subscriptions.</CardDescription>
        </CardHeader>
        <CardContent>
          <AdminLoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
