import Link from "next/link";
import { Search } from "lucide-react";
import { getCategories } from "@/lib/categories";
import { MobileNavDrawer } from "@/components/mobile-nav-drawer";
import { HeaderUserActions } from "@/components/header-user-actions";
import { SearchLocationField } from "@/components/search-location-field";
import { FlikaxLogo } from "@/components/flikax-logo";
import type { Category } from "@/components/category-sidebar";

// `categories` is optional so most call sites keep working unchanged (they
// don't otherwise need it, and this component fetching it itself is no
// extra cost for them). The three ISR pages (homepage, category, listing
// detail) pass it explicitly, since they already fetch it for their own
// sidebar/nav anyway -- doing so means SiteHeader makes *zero* Supabase/
// cookies() calls in their render path, which is what keeps those specific
// pages static/ISR-eligible. Auth state (login status, unread badge, avatar)
// is no longer fetched here at all -- see HeaderUserActions/useSessionSummary
// for why that moved to a client-side fetch instead of a prop.
export async function SiteHeader({ categories: categoriesProp }: { categories?: Category[] }) {
  const categories = categoriesProp ?? (await getCategories());

  return (
    <header className="sticky top-0 z-50 bg-black shadow-lg">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2 sm:gap-4 sm:py-2.5 sm:px-6">
        {/* Left: hamburger + logo + nav */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <MobileNavDrawer categories={categories} />
          <FlikaxLogo iconSize="size-7 sm:size-8" wordmarkSize="text-xl sm:text-2xl" />
        </div>

        <nav className="hidden shrink-0 items-center gap-5 text-sm font-medium text-white/80 lg:flex">
          <Link href="/" className="hover:text-white">Browse</Link>
          <Link href="/?category=vehicles" className="hover:text-white">Vehicles</Link>
          <Link href="/?category=property" className="hover:text-white">Property</Link>
        </nav>

        {/* Center: search pill with location picker */}
        <form
          action="/"
          method="get"
          className="hidden flex-1 items-center rounded-full bg-white shadow-inner lg:flex"
        >
          <SearchLocationField />
          <span className="h-5 w-px shrink-0 bg-neutral-200" />
          <input
            name="q"
            type="search"
            placeholder="Search phones, cars, houses, jobs…"
            className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-neutral-800 outline-none placeholder:text-neutral-400"
          />
          <button
            type="submit"
            aria-label="Search"
            className="mr-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-white hover:bg-brand-dark"
          >
            <Search className="size-4" />
          </button>
        </form>

        {/* Right: icons + CTA */}
        <HeaderUserActions />
      </div>
    </header>
  );
}
