import Link from "next/link";
import { SquarePlus, ShieldCheck, Gem, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

const QUICK_LINKS: { label: string; description: string; href: string; icon: LucideIcon }[] = [
  { label: "Post an Ad", description: "List an item free in minutes", href: "/sell", icon: SquarePlus },
  { label: "Trust & Safety", description: "Buy and sell with confidence", href: "/trust-safety", icon: ShieldCheck },
  { label: "Go Premium", description: "Boost your listings for more views", href: "/premium", icon: Gem },
];

export function HomepageQuickLinks() {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-4">
      {QUICK_LINKS.map(({ label, description, href, icon: Icon }) => (
        <Link key={label} href={href} className="group">
          <Card className="flex-col items-center gap-1.5 border-neutral-200 p-3 text-center shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-lg sm:gap-2 sm:p-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand transition-colors group-hover:bg-brand group-hover:text-white sm:size-12">
              <Icon className="size-5 sm:size-6" />
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-bold leading-tight text-neutral-800 sm:text-sm">{label}</span>
              <span className="hidden truncate text-xs text-neutral-500 sm:block">{description}</span>
            </span>
          </Card>
        </Link>
      ))}
    </div>
  );
}
