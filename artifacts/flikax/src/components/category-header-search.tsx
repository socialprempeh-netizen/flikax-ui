import { Search } from "lucide-react";

/**
 * Search-within-category field, rendered by SiteHeader itself (see its
 * `categorySearch` prop) in place of the general SearchBar -- Tonaton's
 * category pages show exactly one search field in the green header, not a
 * second white strip stacked underneath it. Single input, no location
 * picker/submit button: Enter submits, same as Tonaton's own field.
 */
export function CategoryHeaderSearch({
  categoryName,
  categorySlug,
  query,
}: {
  categoryName: string;
  categorySlug: string;
  query?: string;
}) {
  return (
    <form action={`/${categorySlug}`} method="get" className="w-full">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder={`Search in ${categoryName}`}
          className="h-9 w-full border border-transparent bg-white py-1.5 pl-9 pr-3 text-sm text-neutral-800 outline-none focus:border-brand/30"
        />
      </div>
    </form>
  );
}
