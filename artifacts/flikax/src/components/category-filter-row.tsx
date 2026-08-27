"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronDown, List, LayoutGrid } from "lucide-react";
import type { CategorySort, DatePosted } from "@/lib/category-listings";

const PRICE_BUCKETS: { label: string; minPrice?: string; maxPrice?: string }[] = [
  { label: "Under GH₵100", maxPrice: "100" },
  { label: "GH₵100 – 500", minPrice: "100", maxPrice: "500" },
  { label: "GH₵500 – 2,000", minPrice: "500", maxPrice: "2000" },
  { label: "Over GH₵2,000", minPrice: "2000" },
];

const SORT_OPTIONS: { value: CategorySort; label: string }[] = [
  { value: "recommended", label: "Recommended" },
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
];

const DATE_POSTED_OPTIONS: { value: DatePosted | ""; label: string }[] = [
  { value: "", label: "Any time" },
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
];

function hrefWith(current: URLSearchParams, updates: Record<string, string | undefined>) {
  const params = new URLSearchParams(current);
  params.delete("page"); // any filter change resets pagination
  for (const [key, value] of Object.entries(updates)) {
    if (value) params.set(key, value);
    else params.delete(key);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "?";
}

export function CategoryFilterRow({
  sort,
  datePosted,
  totalCount,
  photosOnly,
  onPhotosOnlyChange,
  viewMode,
  onViewModeChange,
}: {
  sort: CategorySort;
  datePosted?: DatePosted;
  totalCount: number;
  photosOnly: boolean;
  onPhotosOnlyChange: (value: boolean) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (value: "grid" | "list") => void;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeMin = searchParams.get("minPrice") ?? undefined;
  const activeMax = searchParams.get("maxPrice") ?? undefined;

  return (
    <div>
      {/* Pill styling (h-8/32px, border #d0dadd, rounded-[20px], 6px/14px
          padding, 13px/500 type) is a named exception to the sitewide
          square-corners rule -- see DESIGN_SYSTEM.md's pill exceptions.
          gap-2 flex-wrap (not overflow-x-auto) so pills that don't fit one
          row wrap instead of requiring a horizontal scroll. relative +
          before:-inset-1.5 keeps the real tap target at this app's own
          44px touch-target minimum (DESIGN_SYSTEM.md) despite the pill's
          own visual height being a smaller 32px. */}
      <div className="lg:hidden mb-3 flex flex-wrap gap-2">
        {PRICE_BUCKETS.map((bucket) => {
          const isActive = activeMin === bucket.minPrice && activeMax === bucket.maxPrice;
          return (
            <Link
              key={bucket.label}
              href={hrefWith(searchParams, { minPrice: bucket.minPrice, maxPrice: bucket.maxPrice })}
              className={`font-currency relative flex h-8 shrink-0 items-center whitespace-nowrap rounded-[20px] border px-3.5 py-1.5 text-[13px] font-medium before:absolute before:-inset-1.5 before:content-[''] ${
                isActive ? "border-brand bg-brand-light text-brand-dark" : "border-[#d0dadd] bg-white text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              {bucket.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 pb-3 text-sm lg:mt-0 lg:border-none lg:pb-0">
        <div className="flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 select-none">
            <button
              type="button"
              role="switch"
              aria-checked={photosOnly}
              aria-label="Ads with photos"
              onClick={() => onPhotosOnlyChange(!photosOnly)}
              className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                photosOnly ? "bg-[#2EB8A0]" : "bg-neutral-300"
              }`}
            >
              {/* left-0.5 pins the untransformed position to the track's
                  left edge -- translate-x then moves a fixed 18px from
                  that anchor instead of from an unset (and unpredictable)
                  static position, which was overshooting the track and
                  overlapping the label text to its right. */}
              <span
                className={`absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow-sm transition-transform ${
                  photosOnly ? "translate-x-[18px]" : "translate-x-0"
                }`}
              />
            </button>
            <span className="font-medium text-neutral-600">Ads with photos</span>
          </label>
          <span className="hidden font-medium text-neutral-500 sm:inline">
            {totalCount.toLocaleString()} {totalCount === 1 ? "result" : "results"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Grid/list view switcher -- active button fills with the same
              accent as the "Ads with photos" toggle above, inactive stays a
              plain bordered white button. */}
          <div className="flex overflow-hidden rounded-md border border-neutral-200">
            <button
              type="button"
              aria-label="List view"
              aria-pressed={viewMode === "list"}
              onClick={() => onViewModeChange("list")}
              className={`flex items-center justify-center p-1.5 ${
                viewMode === "list" ? "bg-[#2EB8A0] text-white" : "bg-white text-neutral-500 hover:bg-neutral-50"
              }`}
            >
              <List className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Grid view"
              aria-pressed={viewMode === "grid"}
              onClick={() => onViewModeChange("grid")}
              className={`flex items-center justify-center border-l border-neutral-200 p-1.5 ${
                viewMode === "grid" ? "bg-[#2EB8A0] text-white" : "bg-white text-neutral-500 hover:bg-neutral-50"
              }`}
            >
              <LayoutGrid className="size-4" />
            </button>
          </div>

          <div className="relative">
            <select
              aria-label="Date posted"
              value={datePosted ?? ""}
              onChange={(e) => router.push(hrefWith(searchParams, { posted: e.target.value || undefined }))}
              className="appearance-none border border-neutral-200 bg-white py-1.5 pl-2 pr-7 text-sm text-neutral-700 outline-none focus:border-brand"
            >
              {DATE_POSTED_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-neutral-400" />
          </div>

          <div className="relative">
            <select
              aria-label="Sort by"
              value={sort}
              onChange={(e) => router.push(hrefWith(searchParams, { sort: e.target.value }))}
              className="appearance-none border border-neutral-200 bg-white py-1.5 pl-2 pr-7 text-sm text-neutral-700 outline-none focus:border-brand"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-neutral-400" />
          </div>
        </div>
      </div>
    </div>
  );
}
