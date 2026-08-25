"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { ListingGrid, type ListingCard } from "@/components/listing-grid";

type LoadMoreResult = { listings: ListingCard[]; totalCount: number };

export function InfiniteListingGrid({
  initialListings,
  initialTotalCount,
  variant,
  loadMore,
  maxItems,
  layout = "grid",
  photosOnly = false,
}: {
  initialListings: ListingCard[];
  initialTotalCount: number;
  variant?: "default" | "home";
  loadMore: (page: number) => Promise<LoadMoreResult>;
  /** Stops auto-loading once this many listings have accumulated, even if
   * more real results exist -- the homepage caps at a fixed batch count
   * rather than scrolling through the entire catalog. Omit for the
   * uncapped category-page behavior. */
  maxItems?: number;
  /** Category page's grid/list view switcher -- passed straight through to
   * ListingGrid. */
  layout?: "grid" | "list";
  /** Category page's "Ads with photos" toggle -- a client-side filter over
   * whatever's already loaded (not a server-side refetch), so toggling it
   * doesn't reset scroll position or pagination state. */
  photosOnly?: boolean;
}) {
  const [listings, setListings] = useState(initialListings);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [loading, setLoading] = useState(false);
  const [errored, setErrored] = useState(false);
  // Screen readers otherwise have no way to know this grid grew, since the
  // new cards land off-screen (below the fold) and nothing moves focus --
  // a polite live region announces the outcome of each load without
  // interrupting whatever the user is doing.
  const [liveMessage, setLiveMessage] = useState("");
  const pageRef = useRef(1);
  const loadingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // A filter/sort/search change re-renders this component (new key) with a
  // fresh server-rendered first page -- reset the accumulated pages so they
  // don't linger and get appended to under the new filter.
  useEffect(() => {
    setListings(initialListings);
    setTotalCount(initialTotalCount);
    pageRef.current = 1;
    setErrored(false);
  }, [initialListings, initialTotalCount]);

  const effectiveTotal = maxItems ? Math.min(totalCount, maxItems) : totalCount;
  const hasMore = listings.length < effectiveTotal;

  async function loadNext() {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setErrored(false);
    setLiveMessage("Loading more listings…");
    try {
      const nextPage = pageRef.current + 1;
      const result = await loadMore(nextPage);
      setListings((prev) => {
        const merged = [...prev, ...result.listings];
        return maxItems ? merged.slice(0, maxItems) : merged;
      });
      setTotalCount(result.totalCount);
      pageRef.current = nextPage;
      setLiveMessage(
        result.listings.length > 0
          ? `${result.listings.length} more listing${result.listings.length === 1 ? "" : "s"} loaded.`
          : "No more listings to load."
      );
    } catch {
      setErrored(true);
      setLiveMessage("Couldn't load more listings. Try again.");
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }

  // When maxItems is set (homepage), eagerly chain loads immediately after
  // each page arrives until we reach maxItems -- no scrolling required.
  // This keeps the SSR payload small (one page) while still hitting the
  // full card count client-side right after hydration.
  useEffect(() => {
    if (!maxItems || !hasMore || loading || errored) return;
    loadNext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxItems, hasMore, loading, errored]);

  // For uncapped category pages (no maxItems), use an IntersectionObserver
  // so additional pages only load when the user scrolls toward the bottom.
  useEffect(() => {
    if (maxItems) return; // handled by the eager effect above
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadNext();
      },
      { rootMargin: "800px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, maxItems]);

  const visibleListings = photosOnly ? listings.filter((l) => l.imageUrl) : listings;

  return (
    <>
      <div role="status" aria-live="polite" className="sr-only">
        {liveMessage}
      </div>
      <ListingGrid listings={visibleListings} variant={variant} layout={layout} />
      {hasMore && (
        <div ref={sentinelRef} className="flex items-center justify-center py-8">
          {errored ? (
            <button
              type="button"
              onClick={loadNext}
              className="border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Couldn&apos;t load more — try again
            </button>
          ) : (
            loading && <Loader2 className="size-5 animate-spin text-neutral-400" />
          )}
        </div>
      )}
    </>
  );
}
