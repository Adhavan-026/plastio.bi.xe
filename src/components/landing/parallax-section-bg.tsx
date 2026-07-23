"use client";

import { useRef, useState } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

// Smaller version of ParallaxHero for individual sections (Modules, final
// CTA) — a low-opacity background image that drifts as the section scrolls
// by, sitting behind a solid/tinted color so it never fights the readable
// content on top. Same "drop the file, it just appears" pattern as the hero.
export function ParallaxSectionBg({
  src,
  opacityClassName = "opacity-[0.12]",
}: {
  src: string;
  opacityClassName?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], reduceMotion ? ["0%", "0%"] : ["-15%", "15%"]);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  if (failed) return null;

  return (
    <div ref={ref} className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <motion.div style={{ y }} className="absolute inset-0 scale-125">
        {/* eslint-disable-next-line @next/next/no-img-element -- decorative
            background that may not exist yet; see ParallaxHero for why a
            plain <img> is used here instead of next/image. */}
        <img
          src={src}
          alt=""
          className={cn(
            "absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-700",
            loaded && opacityClassName
          )}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      </motion.div>
    </div>
  );
}
