import { MobileNavDrawer } from "@/components/mobile-nav-drawer";
import { HeaderUserActions } from "@/components/header-user-actions";
import { FlikaxLogo } from "@/components/flikax-logo";
import { HeaderSearchBar } from "@/components/header-search-bar";

// Auth state (login status, unread badge, avatar) isn't fetched here at all
// -- see HeaderUserActions/useSessionSummary for why that moved to a
// client-side fetch instead of a prop. Categories aren't needed here either;
// MobileNavDrawer no longer shows a category list (see its own comment).
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 bg-header-bg shadow-lg">
      {/* flex-wrap (not a fixed two-row grid) is what lets this collapse
          cleanly on narrow screens: the search item is w-full below `sm`,
          which alone doesn't fit next to the logo/actions row so it wraps
          onto its own full-width line underneath -- same sticky green bar,
          just two lines tall instead of one. At `sm` and up the container
          stops wrapping and `sm:order-2`/`sm:order-3` (the latter set on
          HeaderUserActions itself) slot the search bar between logo and
          actions, Tonaton-style, where its flex-1 absorbs the row's
          remaining width. */}
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-2 sm:flex-nowrap sm:gap-4 sm:px-6">
        {/* hamburger + logo -- category browsing lives in the homepage's
            icon grid, so this stays a clean identity bar with no separate
            nav links. */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <MobileNavDrawer />
          <FlikaxLogo iconSize="size-7 sm:size-8" wordmarkSize="text-xl sm:text-2xl" />
        </div>

        <div className="order-3 w-full sm:order-2 sm:w-auto sm:min-w-0 sm:max-w-xl sm:flex-1">
          <HeaderSearchBar />
        </div>

        {/* Right: icons + CTA */}
        <HeaderUserActions />
      </div>
    </header>
  );
}
