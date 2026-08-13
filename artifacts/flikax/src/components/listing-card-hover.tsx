"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

// Split into its own tiny client component deliberately -- ListingGrid maps
// over up to 100 listings and stays a Server Component (fast, no added JS
// for the data/mapping logic). Only this small interactive shell hydrates
// per card; whileHover/whileTap are event-driven (not a continuous RAF loop
// or a `layout` animation), which is the cheap end of what Framer Motion
// can do, so it stays fine at grid scale.
export function ListingCardHover({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={`group ${className}`.trim()}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
      // whileTap makes Framer Motion auto-inject tabIndex={0} (so the
      // "tap" gesture is Enter/Space-operable) -- correct for a real
      // control, but this div has no onClick/onTap of its own: the actual
      // link and save button inside it are already independently tabbable.
      // Left as-is, that auto tabIndex was a real, purposeless third tab
      // stop per card (flagged as "tabindex on the wrapper" alongside the
      // save-button nesting bug) -- explicit -1 opts back out of it.
      tabIndex={-1}
    >
      {children}
    </motion.div>
  );
}
