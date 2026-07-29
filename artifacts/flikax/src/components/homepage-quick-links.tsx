import Link from "next/link";
import { SquarePlus, Briefcase, ShieldCheck, Gem, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

const QUICK_LINKS: { label: string; description: string; href: string; icon: LucideIcon }[] = [
  { label: "Post an Ad", description: "List an item free in minutes", href: "/sell", icon: SquarePlus },
  { label: "Find a Job", description: "Browse job listings near you", href: "/?category=recruitment-services", icon: Briefcase },
  { label: "Trust & Safety", description: "Buy and sell with confidence", href: "/trust-safety", icon: ShieldCheck },
  { label: "Go Premium", description: "Boost your listings for more views", href: "/premium", icon: Gem },
];

export function HomepageQuickLinks() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {QUICK_LINKS.map(({ label, description, href, icon: Icon }) => (
        <Link key={label} href={href} className="group">
          <Card className="flex-row items-center gap-3 border-neutral-200 p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-lg">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand transition-colors group-hover:bg-brand group-hover:text-white">
              <Icon className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold text-neutral-800">{label}</span>
              <span className="block truncate text-xs text-neutral-500">{description}</span>
            </span>
          </Card>
        </Link>
      ))}
    </div>
  );
}
