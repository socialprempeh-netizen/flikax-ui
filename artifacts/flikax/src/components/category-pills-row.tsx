"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Grid2x2 } from "lucide-react";
import { buildListingsHref, type ListingFilters } from "@/lib/filters";
import type { Category } from "@/components/category-sidebar";
import { CategoryMegaMenu } from "@/components/category-mega-menu";
import { CategoryThumb } from "@/components/category-thumb";

/** Homepage category row: a horizontally-scrollable strip of pills, one per
 * top-level category, plus an "All categories" pill that opens the Temu-
 * style mega-menu. Replaces the old desktop sidebar + mobile icon grid --
 * category browsing now lives in this one row at every viewport width. */
export function CategoryPillsRow({
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

  function toggleMenu() {
    setActiveParentId((current) => current ?? parents[0]?.id ?? null);
    setMenuOpen((v) => !v);
  }

  return (
    // `relative` lives here, on the wrapper AROUND the scrollable row, not
    // on a wrapper around just the trigger button inside it -- the row has
    // `overflow-x-auto`, and per the CSS spec that forces its *other* axis
    // (overflow-y) into a clipping context too, so an absolutely-positioned
    // panel nested inside the row (the sm+ dropdown) gets its height clipped
    // to the row's own ~44px instead of showing full-size. Anchoring from
    // out here, at the same left edge the button (the row's first/leftmost
    // item) sits at, keeps the panel visually under the button without
    // being a descendant of the clipping container. Below sm the menu is a
    // full-screen `fixed` overlay instead, so this has no effect there.
    <div className="relative">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar sm:mx-0 sm:px-0">
        <button
          type="button"
          onClick={toggleMenu}
          className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
            menuOpen ? "bg-brand-dark text-white" : "bg-brand text-white hover:bg-brand-dark"
          }`}
        >
          <Grid2x2 className="size-3.5" />
          All categories
          <ChevronDown className={`size-3.5 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
        </button>

        {parents.map((cat) => {
          const isActive = cat.slug === selectedSlug;
          return (
            <Link
              key={cat.id}
              href={buildListingsHref({ ...filters, category: cat.slug })}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border py-1 pl-1 pr-3.5 text-sm font-medium transition-colors ${
                isActive
                  ? "border-brand bg-brand-light text-brand"
                  : "border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              <CategoryThumb
                category={cat}
                size="size-7"
                iconSize="size-3.5"
                rounded="rounded-full"
                sizes="28px"
                className="ring-1 ring-slate-200/70"
              />
              {cat.name}
            </Link>
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
