"use client";

import { motion, useReducedMotion } from "motion/react";

// Fades + slides its children up into place the first time they scroll into
// view. Wraps every section below the hero for a consistent "grand entrance"
// feel throughout the page, not just at the top. `useReducedMotion` makes
// this a no-op (renders immediately, fully visible, no animation) for users
// who've asked their OS for reduced motion — an accessibility default, not
// an afterthought.
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 0.6, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
