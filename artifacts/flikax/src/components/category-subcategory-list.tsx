"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CategoryThumb } from "@/components/category-thumb";
import type { SubcategoryWithCount } from "@/lib/category-listings";

const INITIAL_VISIBLE = 6;

type Props = {
  parentId: string;
  subcategories: SubcategoryWithCount[];
};

/** The "Categories" list Tonaton shows in the sidebar on a top-level category's own
 * page (e.g. /vehicles) -- its direct children (leaves) with a real ad count each, so
 * a visitor can jump straight to Cars/Motorcycles & Scooters/etc. and get that leaf's
 * own full detailed filter set (this page's own sidebar stays short -- see
 * getTopLevelDisplayFields). Desktop-only: a mobile equivalent used to render
 * separately (CategorySubcategoryListMobile, since removed) directly above this same
 * data rendered again by CategoryQuickFilters as the page's top tile bar -- a visible
 * duplicate on mobile. CategoryQuickFilters (in [category]/page.tsx's topBarItems) is
 * now the single source for a top-level page's subcategories on every breakpoint; this
 * component is purely the *additional*, differently-styled sidebar list, same as
 * Tonaton's own aside "Categories" list existing alongside its top filter-grid bar. */

export function CategorySubcategoryListDesktop({ parentId, subcategories }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (subcategories.length === 0) return null;

  const visible = expanded ? subcategories : subcategories.slice(0, INITIAL_VISIBLE);
  const hasMore = subcategories.length > INITIAL_VISIBLE;

  return (
    <div className="hidden w-[285px] shrink-0 lg:block">
      <div className="border-[1.5px] border-neutral-300 bg-white p-3">
        <p className="mb-2 text-sm font-semibold text-neutral-700">Categories</p>
        <div className="divide-y divide-neutral-300">
          {visible.map((sub) => (
            <Link
              key={sub.id}
              href={`/${sub.slug}`}
              className="flex items-center gap-2.5 px-1.5 py-3 text-sm text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-brand-dark"
            >
              <CategoryThumb
                category={{ ...sub, parent_id: parentId }}
                size="size-7"
                iconSize="size-3.5"
                rounded="rounded-full"
                sizes="28px"
                className="ring-1 ring-neutral-200"
              />
              <span className="min-w-0 flex-1 truncate">{sub.name}</span>
              <span className="shrink-0 text-xs text-neutral-400">{sub.count.toLocaleString()} ads</span>
            </Link>
          ))}
        </div>
        {hasMore && !expanded && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="mt-1 flex items-center gap-0.5 px-1.5 text-xs font-semibold text-brand-dark hover:underline"
          >
            Show all {subcategories.length}
            <ChevronRight className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
