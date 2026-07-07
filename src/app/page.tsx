import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">Universal Billing System</h1>
      <p className="text-muted-foreground max-w-md">
        Multi-tenant billing for agro shops, tyre shops, and everyone else.
      </p>
      <div className="flex gap-3">
        <Button render={<Link href="/signup" />} nativeButton={false}>
          Create your shop
        </Button>
        <Button render={<Link href="/login" />} nativeButton={false} variant="outline">
          Log in
        </Button>
      </div>
    </div>
  );
}
