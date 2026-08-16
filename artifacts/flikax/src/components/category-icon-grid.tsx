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

const TILE_CLASSES =
  "group flex cursor-pointer flex-col items-center justify-start rounded-lg p-2.5 text-center transition-colors duration-150 hover:bg-[#d1f4e5]/60";
const CIRCLE_CLASSES =
  "mx-auto flex h-[64px] w-[64px] shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200/60 bg-slate-100/90 shadow-sm md:h-[72px] md:w-[72px]";
const IMAGE_CLASSES = "h-11 w-11 shrink-0 transition-transform duration-150 group-hover:scale-105 md:h-13 md:w-13";
const TITLE_CLASSES = "mx-auto mt-2 max-w-[100px] text-center text-[11px] font-bold leading-tight md:text-[12px]";
const SUBTEXT_CLASSES = "mt-0.5 text-center text-[10px] font-normal text-gray-400 md:text-[11px]";

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

  return (
    <Link href={`/${category.slug}`} title={category.name} className={TILE_CLASSES}>
      <span className={`${CIRCLE_CLASSES} ${isActive ? "ring-2 ring-brand" : ""}`}>
        {imagePath ? (
          <span className={`relative ${IMAGE_CLASSES}`}>
            <Image
              src={imagePath}
              alt={category.name}
              fill
              sizes="52px"
              className="object-contain mix-blend-multiply"
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

/** Homepage category browser, styled to match Tonaton/AliExpress: circular
 * icon badges on a light grey background with a square mint hover card,
 * 4-column grid on mobile, 8-column on desktop. Mobile collapses to 7
 * categories + an "All categories" tile (expands in-place on tap, nothing
 * ever truly hidden); desktop always shows every top-level category. */
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
      <div className="mx-auto max-w-5xl px-4 py-5 md:py-6">
        <div className="grid grid-cols-4 items-start justify-center gap-x-2 gap-y-5 md:hidden">
          {mobileParents.map((cat) => (
            <CategoryTile key={cat.id} category={cat} count={counts.get(cat.id) ?? 0} isActive={cat.slug === selectedSlug} />
          ))}
          {showUtilityTile && (
            <button type="button" onClick={() => setMobileExpanded(true)} className={TILE_CLASSES}>
              <span className={CIRCLE_CLASSES}>
                <List className="h-6 w-6 text-neutral-700" />
              </span>
              <span className={`${TITLE_CLASSES} text-gray-900`}>All categories</span>
              <span className={SUBTEXT_CLASSES}>{formatAdCount(totalCount)}</span>
            </button>
          )}
        </div>

        <div className="hidden items-start justify-center gap-x-4 gap-y-6 md:grid md:grid-cols-8">
          {parents.map((cat) => (
            <CategoryTile key={cat.id} category={cat} count={counts.get(cat.id) ?? 0} isActive={cat.slug === selectedSlug} />
          ))}
        </div>
      </div>
    </div>
  );
}
