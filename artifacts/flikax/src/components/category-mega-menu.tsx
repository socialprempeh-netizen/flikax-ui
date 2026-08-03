"use client";

import { useEffect } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { buildListingsHref, type ListingFilters } from "@/lib/filters";
import type { Category } from "@/components/category-sidebar";
import { CategoryThumb } from "@/components/category-thumb";

/** Temu-style two-pane category browser: a left list of top-level
 * categories and a right icon+label grid of the active one's children.
 * Positioned via `anchor` (viewport coordinates from the trigger button's
 * own getBoundingClientRect, computed by the caller) on sm+ screens;
 * on mobile it always takes over the full screen instead, since a small
 * anchored dropdown isn't usable at phone width. */
export function CategoryMegaMenu({
  open,
  onClose,
  parents,
  categories,
  filters,
  activeParentId,
  onHoverParent,
  anchor,
}: {
  open: boolean;
  onClose: () => void;
  parents: Category[];
  categories: Category[];
  filters: ListingFilters;
  activeParentId: string | null;
  onHoverParent: (id: string) => void;
  anchor: { top: number; left: number } | null;
}) {
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const activeParent = parents.find((p) => p.id === activeParentId) ?? parents[0];
  const children = activeParent ? categories.filter((c) => c.parent_id === activeParent.id) : [];

  return (
    <>
      {/* Click-away layer -- only needed on sm+, where the panel is a small
          anchored dropdown rather than a full-screen takeover. */}
      <div className="fixed inset-0 z-40 hidden sm:block" onClick={onClose} aria-hidden="true" />

      <div
        style={
          anchor
            ? ({ "--mm-top": `${anchor.top}px`, "--mm-left": `${anchor.left}px` } as React.CSSProperties)
            : undefined
        }
        className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-white sm:inset-auto sm:top-[var(--mm-top)] sm:left-[var(--mm-left)] sm:h-auto sm:max-h-[70vh] sm:w-[600px] sm:rounded-2xl sm:border sm:border-neutral-200 sm:shadow-xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-neutral-100 px-4 py-3 sm:hidden">
          <span className="text-base font-bold text-neutral-800">All categories</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-8 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100"
          >
            <X className="size-4.5" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1">
          {/* Left: top-level categories. `min-h-0` here (not just on the row
              wrapper above) is the fix for the panel getting "stuck" and
              refusing to scroll -- a flex item's default min-height is
              `auto` (sized to its content), which silently overrides
              `overflow-y-auto` and lets the list blow past its allotted
              height instead of scrolling. Every scrollable flex item in the
              chain needs its own explicit min-h-0. */}
          <div className="w-32 min-h-0 shrink-0 overflow-y-auto border-r border-neutral-100 py-2 sm:w-48">
            {parents.map((cat) => {
              const isActive = cat.id === activeParent?.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onMouseEnter={() => onHoverParent(cat.id)}
                  onClick={() => onHoverParent(cat.id)}
                  className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-xs font-medium transition-colors sm:text-sm ${
                    isActive ? "bg-brand-light text-brand" : "text-neutral-600 hover:bg-neutral-50"
                  }`}
                >
                  <CategoryThumb
                    category={cat}
                    size="size-8"
                    iconSize="size-4"
                    rounded="rounded-full"
                    sizes="32px"
                    className="shrink-0 ring-1 ring-slate-200/70"
                  />
                  {/* No truncate/nowrap -- long names (e.g. "Commercial
                      Equipment & Tools") wrap to a second line instead of
                      being cut off with an ellipsis, so the full name is
                      always readable. */}
                  <span className="min-w-0 flex-1 leading-tight">{cat.name}</span>
                </button>
              );
            })}
          </div>

          {/* Right: active category's subcategories */}
          <div className="min-h-0 min-w-0 flex-1 overflow-y-auto p-4">
            {activeParent && (
              <Link
                href={buildListingsHref({ ...filters, category: activeParent.slug })}
                onClick={onClose}
                className="mb-3 inline-block text-sm font-semibold text-neutral-800 hover:text-brand"
              >
                All {activeParent.name} &rsaquo;
              </Link>
            )}
            <div className="grid grid-cols-2 gap-x-2 gap-y-5 sm:grid-cols-4">
              {children.map((child) => (
                <Link
                  key={child.id}
                  href={`/${child.slug}`}
                  onClick={onClose}
                  className="group flex flex-col items-center gap-2 text-center"
                >
                  <CategoryThumb
                    category={child}
                    size="size-16"
                    iconSize="size-7"
                    rounded="rounded-full"
                    sizes="64px"
                    className="shadow-sm ring-2 ring-white transition-transform group-hover:scale-105"
                  />
                  <span className="line-clamp-2 text-xs font-medium leading-tight text-neutral-700">
                    {child.name}
                  </span>
                </Link>
              ))}
              {children.length === 0 && (
                <p className="col-span-full py-6 text-center text-sm text-neutral-400">No subcategories.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
