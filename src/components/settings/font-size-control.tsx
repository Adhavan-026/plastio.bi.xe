"use client";

import { useFontSize } from "@/components/font-size-provider";
import { FONT_SIZES, FONT_SIZE_LABELS, type FontSizeKey } from "@/lib/font-size";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function FontSizeControl() {
  const { fontSize, setFontSize } = useFontSize();

  return (
    <div className="bg-card flex max-w-lg flex-col gap-3 rounded-xl border p-4 shadow-sm">
      <div>
        <h2 className="text-sm font-bold">Display</h2>
        <p className="text-muted-foreground text-xs">
          Adjust text size across the app. Applies to this device only, and takes effect
          immediately — no need to save.
        </p>
      </div>
      <div className="flex max-w-xs flex-col gap-2">
        <Label htmlFor="fontSize">Font size</Label>
        <Select
          value={fontSize}
          onValueChange={(v) => setFontSize(v as FontSizeKey)}
          items={FONT_SIZE_LABELS}
        >
          <SelectTrigger id="fontSize" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(FONT_SIZES) as FontSizeKey[]).map((key) => (
              <SelectItem key={key} value={key}>
                {FONT_SIZE_LABELS[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
