"use client";

import { useState } from "react";
import { FolderPlus } from "lucide-react";
import { createProductCategory } from "@/app/actions/product-categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function AddCategoryDialog({
  onCreated,
  triggerVariant = "outline",
}: {
  onCreated: (category: { id: string; name: string }) => void;
  triggerVariant?: "outline" | "ghost";
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setPending(true);
    setError(null);
    const result = await createProductCategory(name);
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    onCreated(result.category);
    setName("");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" variant={triggerVariant} onClick={() => setOpen(true)}>
        <FolderPlus /> Add category
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add product category</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="new-category-name">Category name</Label>
            <Input
              id="new-category-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Tyre, Tube, Battery"
              required
              autoFocus
            />
            {error && <p className="text-destructive text-sm">{error}</p>}
          </div>
          <DialogFooter className="-mx-0 -mb-0 border-t-0 bg-transparent p-0 sm:justify-end">
            <Button type="submit" disabled={pending || !name.trim()}>
              {pending ? "Adding..." : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
