"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { List } from "lucide-react";
import type { Category } from "@/components/category-sidebar";
import { resolveCategoryImage } from "@/lib/category-images";
import { resolveCategoryIcon } from "@/lib/category-icons";

// How many top-level categories the mobile grid shows before collapsing the
// rest behind the "All categories" tile (Tonaton shows 7 + that tile == 2
// rows of 4). Desktop always shows every category, uncollapsed.
const MOBILE_VISIBLE_COUNT = 7;

// Tailwind's compiler scans source for literal class strings, so these have
// to be spelled out in full rather than built with template interpolation,
// which it can't statically detect (same convention as category-colors.ts).
// Desktop-only -- mobile cards stay a uniform bg-[#CEFFEE] regardless of
// category, this per-category fill only kicks in at md:.
const DESKTOP_CARD_COLOR_BY_SLUG: Record<string, string> = {
  vehicles: "md:bg-[#56B78C]",
  "phones-tablets": "md:bg-[#2EB8A0]",
  property: "md:bg-[#7EC89B]",
  electronics: "md:bg-[#124E40]",
  fashion: "md:bg-[#A8D8B8]",
  "animals-pets": "md:bg-[#6FCB8B]",
  "babies-kids": "md:bg-[#D2E8D0]",
  "beauty-personal-care": "md:bg-[#55C59D]",
  "commercial-equipment-tools": "md:bg-[#0E3D32]",
  "food-agriculture-farming": "md:bg-[#9AB26E]",
  "home-furniture-appliances": "md:bg-[#2EB89E]",
  "leisure-activities": "md:bg-[#6FC97A]",
  "repair-construction": "md:bg-[#8CCB84]",
  services: "md:bg-[#B6E2B8]",
};
const DEFAULT_DESKTOP_CARD_COLOR = "md:bg-[#CEFFEE]";

const TILE_CLASSES =
  "group flex cursor-pointer flex-col items-center justify-start rounded-lg p-1.5 text-center transition-colors duration-150 hover:bg-[#AFC8B2]";
const CARD_BASE_CLASSES =
  "mx-auto flex h-16 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#CEFFEE] shadow-[0_4px_14px_rgba(0,0,0,0.10)] md:h-[78px] md:w-[68px]";
const IMAGE_CLASSES = "h-7 w-7 shrink-0 transition-transform duration-150 group-hover:scale-105 md:h-8 md:w-8";
const TITLE_CLASSES = "mx-auto mt-1.5 max-w-[85px] text-center text-[14px] font-bold leading-tight";
const SUBTEXT_CLASSES = "mt-0.5 text-center text-[12px] font-normal text-gray-500";

function formatAdCount(count: number): string {
  return `${count.toLocaleString("en-US").replace(/,/g, " ")} ads`;
}

function CategoryTile({
  category,
  count,
  isActive,
}: {
  category: Category;
  count: number;
  isActive: boolean;
}) {
  const imagePath = resolveCategoryImage(category);
  const Icon = resolveCategoryIcon(category);
  const cardColorClass = DESKTOP_CARD_COLOR_BY_SLUG[category.slug] ?? DEFAULT_DESKTOP_CARD_COLOR;

  return (
    <Link href={`/${category.slug}`} title={category.name} className={TILE_CLASSES}>
      <span className={`${CARD_BASE_CLASSES} ${cardColorClass} ${isActive ? "ring-2 ring-brand" : ""}`}>
        {imagePath ? (
          <span className={`relative ${IMAGE_CLASSES}`}>
            <Image
              src={imagePath}
              alt={category.name}
              fill
              sizes="32px"
              className="object-contain opacity-100 brightness-[1.15] contrast-[1.1] saturate-[1.2]"
            />
          </span>
        ) : (
          <Icon className={`${IMAGE_CLASSES} text-neutral-700`} />
        )}
      </span>
      <span className={`${TITLE_CLASSES} ${isActive ? "text-brand-dark" : "text-gray-900"}`}>{category.name}</span>
      <span className={SUBTEXT_CLASSES}>{formatAdCount(count)}</span>
    </Link>
  );
}

/** Homepage category browser, styled to match Tonaton/Flikax reference:
 * fixed-size portrait cards (uniform mint on mobile, per-category color on
 * desktop), 4-column grid on mobile, 8-column on desktop. Mobile collapses
 * to 7 categories + an "All categories" tile (expands in-place on tap,
 * nothing ever truly hidden); desktop always shows every top-level category. */
export function CategoryIconGrid({
  categories,
  selectedSlug,
  counts,
}: {
  categories: Category[];
  selectedSlug?: string;
  counts: Map<string, number>;
}) {
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const parents = categories.filter((c) => c.parent_id === null);
  const totalCount = [...counts.values()].reduce((sum, n) => sum + n, 0);
  const mobileParents = mobileExpanded ? parents : parents.slice(0, MOBILE_VISIBLE_COUNT);
  const showUtilityTile = !mobileExpanded && parents.length > MOBILE_VISIBLE_COUNT;

  return (
    <div className="w-full bg-white md:bg-transparent">
      <div className="mx-auto max-w-5xl px-4 py-3 md:py-4">
        <div className="grid grid-cols-4 items-start justify-center gap-4 md:hidden">
          {mobileParents.map((cat) => (
            <CategoryTile key={cat.id} category={cat} count={counts.get(cat.id) ?? 0} isActive={cat.slug === selectedSlug} />
          ))}
          {showUtilityTile && (
            <button type="button" onClick={() => setMobileExpanded(true)} className={TILE_CLASSES}>
              <span className={CARD_BASE_CLASSES}>
                <List className="h-6 w-6 text-neutral-700" />
              </span>
              <span className={`${TITLE_CLASSES} text-gray-900`}>All categories</span>
              <span className={SUBTEXT_CLASSES}>{formatAdCount(totalCount)}</span>
            </button>
          )}
        </div>

        <div className="hidden items-start justify-center gap-6 md:grid md:grid-cols-8">
          {parents.map((cat) => (
            <CategoryTile key={cat.id} category={cat} count={counts.get(cat.id) ?? 0} isActive={cat.slug === selectedSlug} />
          ))}
        </div>
      </div>
    </div>
  );
}
