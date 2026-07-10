"use client";

import { useEffect } from "react";
import { playClickSound } from "@/lib/click-sound";

// Scoped to actually-interactive elements rather than a literal document-wide
// click listener — a sound on every click including plain text/whitespace
// would be noisy rather than useful feedback.
const INTERACTIVE_SELECTOR =
  'button, a, [role="button"], [role="tab"], [role="menuitem"], [role="option"], input[type="checkbox"], input[type="radio"], input[type="submit"], select, [data-slot="select-trigger"]';

export function ClickSoundProvider() {
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest(INTERACTIVE_SELECTOR)) {
        playClickSound();
      }
    }
    document.addEventListener("click", handleClick, { capture: true });
    return () => document.removeEventListener("click", handleClick, { capture: true });
  }, []);

  return null;
}
