"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { setBomActive } from "@/app/actions/boms";

export function BomActiveToggle({ bomId, isActive }: { bomId: string; isActive: boolean }) {
  const [pending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      const result = await setBomActive(bomId, !isActive);
      if (!result.ok) toast.error(result.message);
    });
  }

  return (
    <Button type="button" variant="outline" size="sm" disabled={pending} onClick={toggle}>
      {isActive ? "Deactivate" : "Activate"}
    </Button>
  );
}
