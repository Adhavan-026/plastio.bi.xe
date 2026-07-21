"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Only ever rendered when isDesktopMode is true (see settings/page.tsx),
// so window.clickOne — injected by electron/preload.js — is always present
// here; it never exists in the cloud build's browser tab.
export function DesktopBackupPanel() {
  const [lastBackupAt, setLastBackupAt] = useState<string | null>(null);
  const [backingUp, setBackingUp] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [restartOpen, setRestartOpen] = useState(false);

  useEffect(() => {
    window.clickOne?.getLastBackupInfo().then((info) => setLastBackupAt(info.lastBackupAt));
  }, []);

  async function handleBackup() {
    setBackingUp(true);
    try {
      const result = await window.clickOne!.backup();
      if (result.canceled) return;
      if (!result.ok) {
        toast.error(result.error ?? "Backup failed.");
        return;
      }
      toast.success(`Backup saved to ${result.path}`);
      const info = await window.clickOne!.getLastBackupInfo();
      setLastBackupAt(info.lastBackupAt);
    } finally {
      setBackingUp(false);
    }
  }

  async function handleRestore() {
    setRestoring(true);
    try {
      const result = await window.clickOne!.restore();
      if (result.canceled) return;
      if (!result.ok) {
        toast.error(result.error ?? "Restore failed.");
        return;
      }
      setConfirmOpen(false);
      setRestartOpen(true);
    } finally {
      setRestoring(false);
    }
  }

  return (
    <div className="bg-card flex max-w-lg flex-col gap-3 rounded-xl border p-4 shadow-sm">
      <div>
        <h2 className="text-sm font-bold">Backup &amp; restore</h2>
        <p className="text-muted-foreground text-xs">
          Your data lives only on this device. Back it up regularly — especially before
          reinstalling Windows or moving to a new computer.
        </p>
      </div>

      <p className="text-muted-foreground text-xs">
        Last backup:{" "}
        {lastBackupAt
          ? new Date(lastBackupAt).toLocaleString("en-IN")
          : "Never — back up now to protect your data."}
      </p>

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={handleBackup} disabled={backingUp}>
          {backingUp ? "Backing up..." : "Backup to file"}
        </Button>
        <Button type="button" variant="outline" onClick={() => setConfirmOpen(true)}>
          Restore from file
        </Button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore from backup?</DialogTitle>
            <DialogDescription>
              This replaces all data currently on this device with the backup file you choose
              next. A safety copy of your current data is kept automatically, but continuing
              can&apos;t be undone from within the app.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleRestore} disabled={restoring}>
              {restoring ? "Restoring..." : "Choose backup file..."}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={restartOpen} onOpenChange={() => {}}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Restore complete</DialogTitle>
            <DialogDescription>
              Restart clickOne now to finish loading your restored data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" onClick={() => window.clickOne?.relaunch()}>
              Restart now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
