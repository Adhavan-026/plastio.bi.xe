"use client";

import { useRef, useState } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

// Drop Whisk/Flow-generated files at these exact paths and they appear
// automatically — no code change needed. Until then, onError hides them
// and the gradient/blob layers underneath carry the section on their own
// (a brief 404 in the dev console for the missing files is expected and
// harmless — see the shot list in the plan this was built from).
const HERO_IMAGE = "/landing/hero-bg.jpg";
const HERO_VIDEO = "/landing/hero-loop.mp4";

// Full-bleed background layer that scrolls slower than the foreground
// content (children) — the classic parallax effect, via scroll-linked
// transform rather than a fixed background (which would fight mobile
// browsers' address-bar-driven viewport resizing).
export function ParallaxHero({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const backgroundY = useTransform(scrollYProgress, [0, 1], reduceMotion ? ["0%", "0%"] : ["0%", "35%"]);

  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  return (
    <div ref={ref} className="relative overflow-hidden">
      <motion.div style={{ y: backgroundY }} className="absolute inset-0 -z-10 scale-125">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0d1b33] via-[#1e3a76] to-[#4a7cba]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(140,178,227,0.35),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_75%,rgba(240,227,168,0.18),transparent_45%)]" />
        {!imageFailed && (
          // eslint-disable-next-line @next/next/no-img-element -- decorative
          // full-bleed background that may not exist yet; next/image errors
          // more intrusively on a missing file than a plain <img> does.
          <img
            // Checked directly in the ref callback, not just onLoad — a
            // fast/cached image (e.g. localhost) can finish loading before
            // React attaches the onLoad listener, so the event never fires
            // and the image would otherwise stay stuck at opacity-0 forever.
            ref={(node) => {
              if (node?.complete && node.naturalWidth > 0) setImageLoaded(true);
            }}
            src={HERO_IMAGE}
            alt=""
            className={cn(
              "absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-700",
              imageLoaded && "opacity-100"
            )}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageFailed(true)}
          />
        )}
        {!videoFailed && (
          <video
            ref={(node) => {
              if (node && node.readyState >= 3) setVideoLoaded(true);
            }}
            className={cn(
              "absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-700",
              videoLoaded && "opacity-100"
            )}
            autoPlay
            muted
            loop
            playsInline
            onCanPlay={() => setVideoLoaded(true)}
            onError={() => setVideoFailed(true)}
          >
            <source src={HERO_VIDEO} type="video/mp4" />
          </video>
        )}
      </motion.div>
      {children}
    </div>
  );
}
