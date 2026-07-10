"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { FONT_SIZES, FONT_SIZE_STORAGE_KEY, type FontSizeKey } from "@/lib/font-size";

type FontSizeContextValue = {
  fontSize: FontSizeKey;
  setFontSize: (value: FontSizeKey) => void;
};

const FontSizeContext = createContext<FontSizeContextValue | null>(null);

export function FontSizeProvider({ children }: { children: React.ReactNode }) {
  const [fontSize, setFontSizeState] = useState<FontSizeKey>("md");

  // The blocking script in the root layout already applies the stored value
  // to the DOM before hydration (avoiding a flash); this just syncs React
  // state to match. localStorage only exists client-side, so this must run
  // in an effect, not a lazy useState initializer (which also runs during SSR).
  useEffect(() => {
    const stored = localStorage.getItem(FONT_SIZE_STORAGE_KEY);
    if (stored && stored in FONT_SIZES) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFontSizeState(stored as FontSizeKey);
    }
  }, []);

  function setFontSize(value: FontSizeKey) {
    setFontSizeState(value);
    localStorage.setItem(FONT_SIZE_STORAGE_KEY, value);
    document.documentElement.style.fontSize = FONT_SIZES[value];
  }

  return (
    <FontSizeContext.Provider value={{ fontSize, setFontSize }}>{children}</FontSizeContext.Provider>
  );
}

export function useFontSize() {
  const ctx = useContext(FontSizeContext);
  if (!ctx) throw new Error("useFontSize must be used within FontSizeProvider");
  return ctx;
}
