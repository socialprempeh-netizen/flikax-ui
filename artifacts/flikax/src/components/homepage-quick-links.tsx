"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { SquarePlus, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

type QuickLink = {
  label: string;
  description: string;
  href: string;
} & ({ icon: LucideIcon; emoji?: never } | { icon?: never; emoji: string });

// Trust & Safety and Go Premium use real emoji glyphs instead of Lucide line
// icons -- matches the existing convention in trust-safety/emoji-card.tsx,
// and reads as a more literal, recognizable image than an abstract outline.
const QUICK_LINKS: QuickLink[] = [
  { label: "Post an Ad", description: "List an item free in minutes", href: "/sell", icon: SquarePlus },
  { label: "Trust & Safety", description: "Buy and sell with confidence", href: "/trust-safety", emoji: "🛡️" },
  { label: "Go Premium", description: "Boost your listings for more views", href: "/premium", emoji: "💎" },
];

export function HomepageQuickLinks() {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-4">
      {QUICK_LINKS.map(({ label, description, href, icon: Icon, emoji }) => (
        <Link key={label} href={href} className="group block">
          <motion.div whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }} transition={{ duration: 0.2 }}>
            <Card className="flex-col items-center gap-1.5 border-neutral-300 p-3 text-center shadow-sm transition-shadow duration-200 group-hover:border-brand/30 group-hover:shadow-lg sm:gap-2 sm:p-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand transition-colors group-hover:bg-brand group-hover:text-white sm:size-12">
                {Icon ? <Icon className="size-5 sm:size-6" /> : <span className="text-lg sm:text-xl">{emoji}</span>}
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-bold leading-tight text-neutral-800 sm:text-sm">{label}</span>
                <span className="hidden truncate text-xs text-neutral-500 sm:block">{description}</span>
              </span>
            </Card>
          </motion.div>
        </Link>
      ))}
    </div>
  );
}
