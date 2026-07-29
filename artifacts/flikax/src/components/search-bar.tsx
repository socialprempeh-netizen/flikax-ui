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
      className="mx-auto flex w-full items-center gap-1.5 rounded-full border border-transparent bg-white p-1.5 text-sm shadow-xl transition-shadow focus-within:border-brand/30 focus-within:shadow-2xl"
    >
      <SearchLocationField defaultLocation={defaultLocation} />

      <span className="h-5 w-px shrink-0 bg-neutral-200" />

      <SearchQueryField defaultQuery={defaultQuery} />

      <button
        type="submit"
        aria-label="Search"
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand text-white transition-colors hover:bg-brand-dark"
      >
        <Search className="size-4" />
      </button>
    </form>
  );
}
