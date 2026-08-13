import { Search } from "lucide-react";
import { SearchLocationField } from "@/components/search-location-field";
import { SearchQueryField } from "@/components/search-query-field";

/**
 * Compact site-wide search embedded directly in the sticky green header bar
 * (Tonaton-style), not a standalone hero band -- SiteHeader renders this on
 * every page, so it stays modest enough (h-9 fields, no shadow) to sit next
 * to the logo instead of dominating the row.
 */
export function HeaderSearchBar({
  defaultQuery,
  defaultLocation,
}: {
  defaultQuery?: string;
  defaultLocation?: string;
}) {
  return (
    <form
      role="search"
      action="/"
      method="get"
      className="flex w-full items-stretch overflow-hidden border border-transparent bg-white text-sm transition-shadow focus-within:border-brand/30 focus-within:shadow-md"
    >
      <div className="flex min-w-0 flex-1 items-center gap-1 pl-1">
        <SearchLocationField defaultLocation={defaultLocation} />

        <span className="h-4 w-px shrink-0 bg-neutral-200" />

        <SearchQueryField defaultQuery={defaultQuery} />
      </div>

      {/* Flush with the bar's right edge rather than a floating button --
          --cta-yellow is the site's one deliberate non-brand accent (same
          as Post Ad), so this still reads as the primary action against the
          white bar. Black text/icon, not white -- see globals.css for the
          contrast numbers behind that call. */}
      <button
        type="submit"
        aria-label="Search"
        className="flex shrink-0 items-center gap-1.5 bg-cta-yellow px-3 text-sm font-semibold text-black transition-colors hover:bg-cta-yellow-hover"
      >
        <Search className="size-3.5" />
        <span className="hidden sm:inline">Search</span>
      </button>
    </form>
  );
}
