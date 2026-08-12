"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown } from "lucide-react";
import { buildListingsHref, type ListingFilters } from "@/lib/filters";

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "recommended", label: "Recommended" },
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
];

/** Homepage row above the listing grid: a "Fresh listings" heading plus a
 * Sort dropdown. The Filters button (price + location) that used to live
 * here was removed entirely per product decision -- Sort is now the only
 * control, kept small and right-aligned. Opens as a plain CSS-anchored
 * dropdown (absolute, relative to its own trigger) on every viewport. */
export function HomeFilterBar({ filters }: { filters: ListingFilters }) {
  const router = useRouter();
  const [sortOpen, setSortOpen] = useState(false);

  const activeSort = SORT_OPTIONS.find((o) => o.value === (filters.sort ?? "recommended")) ?? SORT_OPTIONS[0];

  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-base font-bold tracking-tight text-neutral-800 sm:text-lg">Fresh listings</h2>

      <div className="relative shrink-0">
        <button
          type="button"
          onClick={() => setSortOpen((v) => !v)}
          className="flex items-center gap-1 border border-neutral-200 bg-white px-2.5 py-1 text-xs font-medium text-neutral-600 transition-colors hover:border-neutral-300 hover:bg-neutral-50 sm:text-sm"
        >
          {activeSort.label}
          <ChevronDown className={`size-3 transition-transform ${sortOpen ? "rotate-180" : ""}`} />
        </button>

        {sortOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setSortOpen(false)} aria-hidden="true" />
            <div className="absolute right-0 top-full z-50 mt-1.5 w-44 overflow-hidden border border-neutral-200 bg-white py-1 shadow-lg">
              {SORT_OPTIONS.map((opt) => {
                const isActive = opt.value === activeSort.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setSortOpen(false);
                      router.push(buildListingsHref({ ...filters, sort: opt.value }));
                    }}
                    className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors ${
                      isActive ? "bg-brand-light font-semibold text-brand-dark" : "text-neutral-700 hover:bg-neutral-50"
                    }`}
                  >
                    {opt.label}
                    {isActive && <Check className="size-3.5 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
