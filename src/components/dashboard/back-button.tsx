"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BackButton() {
  const router = useRouter();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => router.back()}
      className="text-muted-foreground hover:text-foreground -ml-2 w-fit gap-1.5 print:hidden"
    >
      <ArrowLeft className="size-4" />
      Back
    </Button>
  );
}
