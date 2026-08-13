import Link from "next/link";
import { ArrowLeft, Bookmark, Search } from "lucide-react";

/**
 * Sticky sub-header for a category listings page: search-within-category on
 * every breakpoint, plus back/saved-listings shortcuts on mobile only (the
 * desktop breadcrumb row above the listings already covers "back", and the
 * account menu already covers saved listings there).
 */
export function CategorySearchHeader({
  categoryName,
  categorySlug,
  query,
}: {
  categoryName: string;
  categorySlug: string;
  query?: string;
}) {
  return (
    // top-[110px]: SiteHeader wraps onto two lines below `sm` now that its
    // own search bar lives in the header row (see site-header.tsx), so this
    // sub-header's offset has to clear that taller two-line height instead
    // of the old single-line one -- sm:top-[76px] is unchanged since
    // SiteHeader stays single-line from `sm` up.
    <div className="sticky top-[110px] z-30 border-b border-neutral-100 bg-white sm:top-[76px]">
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2 sm:px-6">
        {/* before:-inset-3 expands the tap target to 44x44 without growing the
            icon itself or the bar's own height -- this bar stacks under the
            main site header, so keeping its visual footprint minimal matters
            more here than it does for a standalone icon button elsewhere. */}
        <Link
          href="/"
          aria-label="Back to home"
          className="relative shrink-0 text-neutral-500 before:absolute before:-inset-3 before:content-[''] lg:hidden"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <form action={`/${categorySlug}`} method="get" className="min-w-0 flex-1 lg:max-w-sm">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder={`Search in ${categoryName}`}
              className="w-full border border-neutral-200 py-1.5 pl-9 pr-4 text-sm text-neutral-800 outline-none focus:border-brand"
            />
          </div>
        </form>
        <Link
          href="/saved"
          aria-label="Saved listings"
          className="relative shrink-0 text-neutral-500 before:absolute before:-inset-3 before:content-[''] lg:hidden"
        >
          <Bookmark className="size-5" />
        </Link>
      </div>
    </div>
  );
}
