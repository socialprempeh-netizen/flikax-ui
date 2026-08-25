"use client";

import { useState } from "react";
import { CategoryFilterRow } from "@/components/category-filter-row";
import { InfiniteListingGrid } from "@/components/infinite-listing-grid";
import type { ListingCard } from "@/components/listing-grid";
import type { CategorySort, DatePosted } from "@/lib/category-listings";

type LoadMoreResult = { listings: ListingCard[]; totalCount: number };

/** Owns the grid/list view mode and "ads with photos" filter state shared
 * between the top bar (CategoryFilterRow) and the results grid
 * (InfiniteListingGrid) -- lifted up here since the two are siblings under
 * the category page's server component and both need to react to the same
 * toggles. Replaces the old side-by-side CategoryFilterRow +
 * InfiniteListingGrid rendering in [category]/page.tsx and the
 * location-scoped branch of [category]/[slug]/page.tsx. */
export function CategoryResults({
  initialListings,
  initialTotalCount,
  loadMore,
  sort,
  datePosted,
}: {
  initialListings: ListingCard[];
  initialTotalCount: number;
  loadMore: (page: number) => Promise<LoadMoreResult>;
  sort: CategorySort;
  datePosted?: DatePosted;
}) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [photosOnly, setPhotosOnly] = useState(false);

  return (
    <div>
      <div className="mb-4">
        <CategoryFilterRow
          sort={sort}
          datePosted={datePosted}
          totalCount={initialTotalCount}
          photosOnly={photosOnly}
          onPhotosOnlyChange={setPhotosOnly}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
      </div>

      <InfiniteListingGrid
        initialListings={initialListings}
        initialTotalCount={initialTotalCount}
        loadMore={loadMore}
        layout={viewMode}
        photosOnly={photosOnly}
      />
    </div>
  );
}
