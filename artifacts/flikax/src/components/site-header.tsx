import Link from "next/link";
import { MobileNavDrawer } from "@/components/mobile-nav-drawer";
import { HeaderUserActions } from "@/components/header-user-actions";
import { FlikaxLogo } from "@/components/flikax-logo";

// Auth state (login status, unread badge, avatar) isn't fetched here at all
// -- see HeaderUserActions/useSessionSummary for why that moved to a
// client-side fetch instead of a prop. Categories aren't needed here either;
// MobileNavDrawer no longer shows a category list (see its own comment).
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 bg-header-bg shadow-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2 sm:gap-4 sm:px-6">
        {/* Left: hamburger + logo + nav -- search now lives in the hero band
            below instead of here, so this stays a clean identity + nav bar. */}
        <div className="flex shrink-0 items-center gap-5">
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <MobileNavDrawer />
            <FlikaxLogo iconSize="size-7 sm:size-8" wordmarkSize="text-xl sm:text-2xl" />
          </div>

          <nav className="hidden shrink-0 items-center gap-5 text-sm font-medium text-white/70 lg:flex">
            <Link href="/" className="transition-colors hover:text-white">Browse</Link>
            <Link href="/?category=vehicles" className="transition-colors hover:text-white">Vehicles</Link>
            <Link href="/?category=property" className="transition-colors hover:text-white">Property</Link>
          </nav>
        </div>

        {/* Right: icons + CTA */}
        <HeaderUserActions />
      </div>
    </header>
  );
}
