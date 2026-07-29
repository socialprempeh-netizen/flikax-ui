"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

// Split into its own tiny client component deliberately -- ListingGrid maps
// over up to 100 listings and stays a Server Component (fast, no added JS
// for the data/mapping logic). Only this small interactive shell hydrates
// per card; whileHover/whileTap are event-driven (not a continuous RAF loop
// or a `layout` animation), which is the cheap end of what Framer Motion
// can do, so it stays fine at grid scale.
export function ListingCardHover({ children }: { children: ReactNode }) {
  return (
    <motion.div
      className="group"
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  );
}
