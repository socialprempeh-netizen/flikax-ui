import Link from "next/link";
import { ArrowLeft, Bookmark } from "lucide-react";

/** Sticky mobile-only sub-header for a category listings page: back, search-within-category, saved listings. */
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
    <div className="sticky top-[60px] z-30 -mx-4 flex items-center gap-2 border-b border-neutral-100 bg-white px-4 py-2 sm:top-[76px] lg:hidden">
      {/* before:-inset-3 expands the tap target to 44x44 without growing the
          icon itself or the bar's own height -- this bar stacks under the
          main site header, so keeping its visual footprint minimal matters
          more here than it does for a standalone icon button elsewhere. */}
      <Link
        href="/"
        aria-label="Back to home"
        className="relative shrink-0 text-neutral-500 before:absolute before:-inset-3 before:content-['']"
      >
        <ArrowLeft className="size-5" />
      </Link>
      <form action={`/${categorySlug}`} method="get" className="min-w-0 flex-1">
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder={`Search in ${categoryName}`}
          className="w-full rounded-full border border-neutral-200 px-4 py-1.5 text-sm text-neutral-800 outline-none focus:border-brand"
        />
      </form>
      <Link
        href="/saved"
        aria-label="Saved listings"
        className="relative shrink-0 text-neutral-500 before:absolute before:-inset-3 before:content-['']"
      >
        <Bookmark className="size-5" />
      </Link>
    </div>
  );
}
