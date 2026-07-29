"use client";

import { motion } from "framer-motion";

// Next.js remounts template.tsx (unlike layout.tsx, which persists) on every
// navigation, which is what makes it the right hook for a per-page-load
// transition. Deliberately entry-only (no AnimatePresence/exit animation):
// App Router's streaming/Suspense boundaries don't play reliably with
// exit-animation patterns today, so a subtle fade+rise on enter is the safe,
// well-supported version of "page transitions" here rather than a fragile
// full cross-fade.
//
// flex flex-1 flex-col so this wrapper is a transparent layout passthrough —
// every page's own root div already declares flex-1 expecting to size
// against a direct flex-column parent (see app/layout.tsx's body), and this
// sits between them.
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      className="flex min-h-full flex-1 flex-col"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  );
}
