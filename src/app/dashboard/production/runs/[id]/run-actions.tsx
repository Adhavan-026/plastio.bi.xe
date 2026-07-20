"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { startProductionRunAction, cancelProductionRunAction } from "@/app/actions/production-runs";

export function StartRunButton({ runId }: { runId: string }) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await startProductionRunAction(runId);
      if (!result.ok) toast.error(result.message);
    });
  }

  return (
    <Button type="button" onClick={handleClick} disabled={pending}>
      {pending ? "Starting..." : "Start run"}
    </Button>
  );
}

export function CancelRunButton({ runId }: { runId: string }) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm("Cancel this production run? Any issued stock will be reversed.")) return;
    startTransition(async () => {
      const result = await cancelProductionRunAction(runId);
      if (!result.ok) toast.error(result.message);
    });
  }

  return (
    <Button type="button" variant="outline" onClick={handleClick} disabled={pending}>
      {pending ? "Cancelling..." : "Cancel run"}
    </Button>
  );
}
