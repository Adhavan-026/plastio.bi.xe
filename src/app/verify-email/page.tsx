import Link from "next/link";
import { CircleCheck, CircleX } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { verifyEmail } from "@/app/actions/auth";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const result = token ? await verifyEmail(token) : { ok: false, message: "No verification token provided." };

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <Logo className="mb-2 h-6 w-auto" />
          {result.ok ? (
            <CircleCheck className="size-10 text-success" />
          ) : (
            <CircleX className="text-destructive size-10" />
          )}
          <CardTitle>{result.ok ? "Email verified" : "Verification failed"}</CardTitle>
          <CardDescription>{result.message}</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button render={<Link href="/dashboard" />} nativeButton={false}>
            Go to dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
