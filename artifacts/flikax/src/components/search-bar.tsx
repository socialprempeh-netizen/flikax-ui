import { Search } from "lucide-react";
import { SearchLocationField } from "@/components/search-location-field";
import { SearchQueryField } from "@/components/search-query-field";

export function SearchBar({
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
      className="mx-auto flex w-full items-stretch overflow-hidden border border-transparent bg-white text-sm shadow-xl transition-shadow focus-within:border-brand/30 focus-within:shadow-2xl"
    >
      <div className="flex min-w-0 flex-1 items-center gap-1 py-1 pl-1">
        <SearchLocationField defaultLocation={defaultLocation} />

        <span className="h-4 w-px shrink-0 bg-neutral-200" />

        <SearchQueryField defaultQuery={defaultQuery} />
      </div>

      {/* Flush with the bar's right edge rather than a floating circle --
          matches the reference's two-tone attached search button.
          --cta-yellow is the site's one deliberate non-brand accent (same
          as Post Ad), so it reads as its own accent against the hero band.
          Black text/icon, not white -- see globals.css for the contrast
          numbers behind that call. */}
      <button
        type="submit"
        aria-label="Search"
        className="flex shrink-0 items-center gap-1.5 bg-cta-yellow px-4 text-sm font-semibold text-black transition-colors hover:bg-cta-yellow-hover"
      >
        <Search className="size-3.5" />
        <span className="hidden sm:inline">Search</span>
      </button>
    </form>
  );
}
