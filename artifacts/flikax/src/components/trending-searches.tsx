import Link from "next/link";

// UNUSED -- zero import sites in the app, and its data source
// (fetchTrendingTerms in lib/trending.ts) has zero callers either, so this
// is dead all the way down to the query. Unlike homepage-slider.tsx, there's
// no admin UI depending on it -- this looks like scaffolding that was built
// but never wired into a page, not a reversed decision. Safe to delete, or
// wire into the homepage below the search bar if trending terms are wanted.
/** `terms` is derived from real listing view activity (see fetchTrendingTerms
 * in lib/trending.ts) -- not a curated/hardcoded list. Renders nothing if
 * there isn't enough activity yet to populate it. */
export function TrendingSearches({ terms }: { terms: string[] }) {
  if (terms.length === 0) return null;

  return (
    <div className="mx-auto mt-4 flex max-w-2xl flex-wrap items-center justify-center gap-1.5 text-xs">
      <span className="font-semibold text-white/80">Trending:</span>
      {terms.map((term) => (
        <Link
          key={term}
          href={`/?q=${encodeURIComponent(term)}`}
          className="bg-white/15 px-2.5 py-0.5 font-medium text-white hover:bg-white/25"
        >
          {term}
        </Link>
      ))}
    </div>
  );
}
