"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown, Grid2x2, List, ImageOff, MapPin, Check } from "lucide-react";
import { ListingGrid } from "@/components/listing-grid";
import { formatRelativeTime } from "@/lib/format-time";
import type { SellerCategory, SellerListingCard } from "@/lib/seller-listings";

const currency = new Intl.NumberFormat("en-GH", {
  style: "currency",
  currency: "GHS",
  maximumFractionDigits: 0,
});

type Sort = "recommended" | "newest" | "price_asc" | "price_desc";

const SORT_OPTIONS: { value: Sort; label: string }[] = [
  { value: "recommended", label: "Recommended" },
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
];

/**
 * The seller-store page's listings section: a category filter row (only the
 * categories this seller actually has active listings in), a sort dropdown,
 * and a grid/list view toggle, all applied client-side against the one
 * already-fetched listing set -- there's no per-filter server round trip,
 * since a single seller's listing count is small enough that re-filtering
 * and re-sorting an in-memory array is instant and simpler than wiring up
 * query params for it.
 */
export function SellerStoreListings({
  listings,
  categories,
}: {
  listings: SellerListingCard[];
  categories: SellerCategory[];
}) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>("recommended");
  const [sortOpen, setSortOpen] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");

  const visible = useMemo(() => {
    const filtered = activeCategory
      ? listings.filter((l) => l.categorySlug === activeCategory)
      : listings;

    // "Recommended" is left as-is -- the data layer already ordered it
    // featured/bumped/newest-first server-side; the other three sorts are
    // an explicit user choice that should override that ordering entirely.
    if (sort === "recommended") return filtered;
    const sorted = [...filtered];
    if (sort === "newest") {
      sorted.sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());
    } else if (sort === "price_asc") {
      sorted.sort((a, b) => a.price - b.price);
    } else {
      sorted.sort((a, b) => b.price - a.price);
    }
    return sorted;
  }, [listings, activeCategory, sort]);

  const activeSort = SORT_OPTIONS.find((o) => o.value === sort) ?? SORT_OPTIONS[0];

  return (
    <div className="flex flex-col gap-3">
      {categories.length > 1 && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar sm:mx-0 sm:px-0">
          <button
            type="button"
            onClick={() => setActiveCategory(null)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
              activeCategory === null ? "bg-brand text-white" : "border border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-50"
            }`}
          >
            All ({listings.length})
          </button>
          {categories.map((cat) => {
            const count = listings.filter((l) => l.categorySlug === cat.slug).length;
            const isActive = activeCategory === cat.slug;
            return (
              <button
                key={cat.slug}
                type="button"
                onClick={() => setActiveCategory(cat.slug)}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                  isActive ? "bg-brand text-white" : "border border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-50"
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-neutral-500">
          {visible.length} listing{visible.length === 1 ? "" : "s"}
        </p>

        <div className="flex shrink-0 items-center gap-2">
          {/* Grid/list toggle -- purely a client-side rendering choice, same
              data either way, so it doesn't need a query param. */}
          <div className="flex items-center overflow-hidden rounded-full border border-neutral-200">
            <button
              type="button"
              onClick={() => setView("grid")}
              aria-label="Grid view"
              aria-pressed={view === "grid"}
              className={`flex size-9 items-center justify-center transition-colors ${
                view === "grid" ? "bg-brand text-white" : "bg-white text-neutral-500 hover:bg-neutral-50"
              }`}
            >
              <Grid2x2 className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              aria-label="List view"
              aria-pressed={view === "list"}
              className={`flex size-9 items-center justify-center transition-colors ${
                view === "list" ? "bg-brand text-white" : "bg-white text-neutral-500 hover:bg-neutral-50"
              }`}
            >
              <List className="size-4" />
            </button>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setSortOpen((v) => !v)}
              className="flex items-center gap-1.5 rounded-full border border-neutral-300 bg-white px-3.5 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
            >
              {activeSort.label}
              <ChevronDown className={`size-3.5 transition-transform ${sortOpen ? "rotate-180" : ""}`} />
            </button>

            {sortOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setSortOpen(false)} aria-hidden="true" />
                <div className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl border border-neutral-200 bg-white py-1 shadow-xl">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setSort(opt.value);
                        setSortOpen(false);
                      }}
                      className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm ${
                        opt.value === sort ? "bg-brand-light font-semibold text-brand" : "text-neutral-700 hover:bg-neutral-50"
                      }`}
                    >
                      {opt.label}
                      {opt.value === sort && <Check className="size-3.5 shrink-0" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-neutral-300 bg-white py-16 text-center">
          <p className="text-sm font-medium text-neutral-600">No listings in this category.</p>
        </div>
      ) : view === "grid" ? (
        <ListingGrid listings={visible} />
      ) : (
        <div className="-mx-4 divide-y divide-neutral-100 overflow-hidden rounded-none border-y border-neutral-100 bg-white sm:mx-0 sm:rounded-xl sm:border">
          {visible.map((listing) => (
            <Link key={listing.id} href={listing.href} className="flex items-center gap-3 p-3 hover:bg-neutral-50">
              <div className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-cream text-brand/40">
                {listing.imageUrl ? (
                  <Image src={listing.imageUrl} alt={listing.title} fill sizes="80px" quality={82} className="object-cover" />
                ) : (
                  <ImageOff className="size-6" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-base font-extrabold tracking-tight text-brand">{currency.format(listing.price)}</p>
                <p className="line-clamp-1 text-sm font-bold text-neutral-900">{listing.title}</p>
                <div className="mt-0.5 flex items-center gap-1 text-xs text-neutral-500">
                  <MapPin className="size-3 shrink-0" />
                  <span className="min-w-0 truncate">{listing.location}</span>
                  {listing.createdAt && (
                    <>
                      <span className="shrink-0 text-neutral-300">•</span>
                      <span className="shrink-0">{formatRelativeTime(new Date(listing.createdAt))}</span>
                    </>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
