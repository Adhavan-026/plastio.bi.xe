"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const MAX_SOURCE_BYTES = 8 * 1024 * 1024; // 8MB raw upload, before resizing
const TARGET_SIZE = 200; // px, longest side of the resized square

function resizeToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Couldn't read that file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("That doesn't look like a valid image."));
      img.onload = () => {
        const scale = Math.min(TARGET_SIZE / img.width, TARGET_SIZE / img.height, 1);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Couldn't process that image."));
        // Flatten onto white — the logo is printed on white invoice paper,
        // so transparent source images shouldn't carry transparency through.
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function LogoUpload({ defaultValue }: { defaultValue: string | null }) {
  const [logoUrl, setLogoUrl] = useState(defaultValue ?? "");
  const [pending, setPending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (file.size > MAX_SOURCE_BYTES) {
      toast.error("That image is too large — please choose one under 8MB.");
      return;
    }
    setPending(true);
    try {
      setLogoUrl(await resizeToDataUrl(file));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't process that image.");
    } finally {
      setPending(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Label>Shop logo</Label>
      <div className="flex items-center gap-3">
        <div className="bg-muted flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- client-resized data URL, not an optimizable remote asset
            <img src={logoUrl} alt="Shop logo preview" className="h-full w-full object-contain" />
          ) : (
            <span className="text-muted-foreground text-[10px]">No logo</span>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => fileInputRef.current?.click()}
            >
              {pending ? "Processing..." : logoUrl ? "Change logo" : "Upload logo"}
            </Button>
            {logoUrl && (
              <Button type="button" variant="ghost" size="sm" onClick={() => setLogoUrl("")}>
                Remove
              </Button>
            )}
          </div>
          <p className="text-muted-foreground text-xs">
            PNG or JPG. Shown on the printed invoice header — save settings below to apply.
          </p>
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <input type="hidden" name="logoUrl" value={logoUrl} />
    </div>
  );
}
