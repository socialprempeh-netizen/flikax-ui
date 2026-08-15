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
    <Link href={`/${category.slug}`} title={category.name} className="flex flex-col items-center">
      <span
        className={`mx-auto flex size-16 items-center justify-center rounded-full bg-[#d1f4e5] shadow-none transition-transform hover:scale-105 md:size-20 ${
          isActive ? "ring-2 ring-brand" : ""
        }`}
      >
        {imagePath ? (
          <span className="relative size-10 shrink-0 md:size-12">
            <Image src={imagePath} alt={category.name} fill sizes="48px" className="object-contain" />
          </span>
        ) : (
          <Icon className="size-10 text-neutral-700 md:size-12" />
        )}
      </span>
      <span
        className={`mt-2 line-clamp-2 text-center text-[12px] font-bold leading-tight md:text-sm ${
          isActive ? "text-brand-dark" : "text-gray-900"
        }`}
      >
        {category.name}
      </span>
      <span className="mt-0.5 text-center text-[10px] font-normal text-gray-400 md:text-xs">
        {formatAdCount(count)}
      </span>
    </Link>
  );
}

/** Homepage category browser, styled to match Tonaton: circular icon badges
 * on a light-green background, 4-column grid on mobile, 8-column on desktop.
 * Mobile collapses to 7 categories + an "All categories" tile (expands
 * in-place on tap, nothing ever truly hidden); desktop always shows every
 * top-level category. */
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
    <>
      <div className="grid grid-cols-4 gap-x-2 gap-y-6 bg-white px-4 py-6 md:hidden">
        {mobileParents.map((cat) => (
          <CategoryTile key={cat.id} category={cat} count={counts.get(cat.id) ?? 0} isActive={cat.slug === selectedSlug} />
        ))}
        {showUtilityTile && (
          <button type="button" onClick={() => setMobileExpanded(true)} className="flex flex-col items-center">
            <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-[#d1f4e5] shadow-none transition-transform hover:scale-105">
              <List className="size-6 text-neutral-700" />
            </span>
            <span className="mt-2 line-clamp-2 text-center text-[12px] font-bold leading-tight text-gray-900">
              All categories
            </span>
            <span className="mt-0.5 text-center text-[10px] font-normal text-gray-400">{formatAdCount(totalCount)}</span>
          </button>
        )}
      </div>

      <div className="hidden bg-white px-8 py-6 md:grid md:grid-cols-8 md:gap-x-4 md:gap-y-8">
        {parents.map((cat) => (
          <CategoryTile key={cat.id} category={cat} count={counts.get(cat.id) ?? 0} isActive={cat.slug === selectedSlug} />
        ))}
      </div>
    </>
  );
}
