"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, Grid2x2 } from "lucide-react";
import { buildListingsHref, type ListingFilters } from "@/lib/filters";
import type { Category } from "@/components/category-sidebar";
import { CategoryMegaMenu } from "@/components/category-mega-menu";

const MENU_WIDTH = 600;
const VIEWPORT_MARGIN = 16;

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
  const [anchor, setAnchor] = useState<{ top: number; left: number } | null>(null);
  const [activeParentId, setActiveParentId] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const parents = categories.filter((c) => c.parent_id === null);

  function toggleMenu() {
    if (menuOpen) {
      setMenuOpen(false);
      return;
    }
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      setAnchor({
        top: rect.bottom + 8,
        left: Math.min(rect.left, window.innerWidth - MENU_WIDTH - VIEWPORT_MARGIN),
      });
    }
    setActiveParentId((current) => current ?? parents[0]?.id ?? null);
    setMenuOpen(true);
  }

  return (
    <div className="relative">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar sm:mx-0 sm:px-0">
        <button
          ref={triggerRef}
          type="button"
          onClick={toggleMenu}
          className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
            menuOpen ? "bg-brand-dark text-white" : "bg-brand text-white hover:bg-brand-dark"
          }`}
        >
          <Grid2x2 className="size-4" />
          All categories
          <ChevronDown className={`size-3.5 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
        </button>

        {parents.map((cat) => {
          const isActive = cat.slug === selectedSlug;
          return (
            <Link
              key={cat.id}
              href={buildListingsHref({ ...filters, category: cat.slug })}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "border-brand bg-brand-light text-brand"
                  : "border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-50"
              }`}
            >
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
        anchor={anchor}
      />
    </div>
  );
}
