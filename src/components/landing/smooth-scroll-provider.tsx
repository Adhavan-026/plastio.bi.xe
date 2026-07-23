"use client";

import { useEffect } from "react";
import Lenis from "lenis";

// Buttery inertia scrolling — the ingredient that makes a scroll-heavy page
// feel premium/cinematic rather than just having elements move around.
// Skipped entirely for prefers-reduced-motion: smooth/inertia scrolling is
// itself a motion effect some users have explicitly asked to avoid.
export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({ autoRaf: true });
    return () => lenis.destroy();
  }, []);

  return children;
}
