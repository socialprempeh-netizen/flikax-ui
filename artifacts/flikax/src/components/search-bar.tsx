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
      className="mx-auto flex w-full items-stretch overflow-hidden rounded-full border border-transparent bg-white text-sm shadow-xl transition-shadow focus-within:border-brand/30 focus-within:shadow-2xl"
    >
      <div className="flex min-w-0 flex-1 items-center gap-1.5 py-1.5 pl-1.5">
        <SearchLocationField defaultLocation={defaultLocation} />

        <span className="h-5 w-px shrink-0 bg-neutral-200" />

        <SearchQueryField defaultQuery={defaultQuery} />
      </div>

      {/* Flush with the pill's right edge (clipped by the form's own
          rounded-full + overflow-hidden) rather than a floating circle --
          matches the reference's two-tone attached search button. */}
      <button
        type="submit"
        aria-label="Search"
        className="flex shrink-0 items-center gap-1.5 bg-brand px-5 font-semibold text-white transition-colors hover:bg-brand-dark"
      >
        <Search className="size-4" />
        <span className="hidden sm:inline">Search</span>
      </button>
    </form>
  );
}
