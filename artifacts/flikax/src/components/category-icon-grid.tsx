"use client";

import { useState } from "react";
import type { Category } from "@/components/category-sidebar";
import { CategoryMegaMenu } from "@/components/category-mega-menu";
import { CategoryThumb } from "@/components/category-thumb";
import type { ListingFilters } from "@/lib/filters";

/** Homepage category browser: every top-level category as a round icon with
 * its name below (Temu/Tonaton-style), wrapping to as many rows as needed so
 * every category is always visible -- nothing hidden behind a separate "All
 * categories" control. Every icon opens the same flyout mega-menu (left
 * column of parents, right panel of that parent's subcategories), scoped to
 * whichever icon was clicked -- one uniform interaction instead of some
 * icons navigating directly and one special icon opening a menu. */
export function CategoryIconGrid({
  categories,
  selectedSlug,
  filters,
}: {
  categories: Category[];
  selectedSlug?: string;
  filters: ListingFilters;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeParentId, setActiveParentId] = useState<string | null>(null);

  const parents = categories.filter((c) => c.parent_id === null);

  function openMenu(parentId: string) {
    setActiveParentId(parentId);
    setMenuOpen(true);
  }

  return (
    // `relative` anchors the mega-menu panel (see CategoryMegaMenu) to this
    // wrapper's top-left corner at sm+, regardless of which icon in the grid
    // was actually clicked -- a menu anchored to one specific icon among
    // fourteen would jump around the row it opens on.
    <div className="relative">
      <div className="flex flex-wrap gap-x-1 gap-y-4 sm:gap-x-1.5">
        {parents.map((cat) => {
          const isActive = cat.slug === selectedSlug;
          return (
            <button
              key={cat.id}
              type="button"
              title={cat.name}
              onClick={() => openMenu(cat.id)}
              className="group flex w-[74px] shrink-0 flex-col items-center gap-2 rounded-xl p-1.5 text-center transition-colors hover:bg-neutral-100 focus-visible:bg-neutral-100 focus-visible:outline-none sm:w-[88px]"
            >
              <CategoryThumb
                category={cat}
                size="size-14 sm:size-16"
                iconSize="size-6 sm:size-7"
                rounded="rounded-full"
                sizes="64px"
                eager
                className={`shadow-sm ring-2 transition-all group-hover:scale-105 group-hover:shadow-md ${
                  isActive ? "ring-brand" : "ring-white group-hover:ring-brand/30"
                }`}
              />
              <span
                className={`line-clamp-2 text-xs font-medium leading-tight transition-colors ${
                  isActive ? "text-brand" : "text-neutral-700 group-hover:text-brand"
                }`}
              >
                {cat.name}
              </span>
            </button>
          );
        })}
      </div>

      <CategoryMegaMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        parents={parents}
        categories={categories}
        filters={filters}
        activeParentId={activeParentId}
        onHoverParent={setActiveParentId}
      />
    </div>
  );
}
