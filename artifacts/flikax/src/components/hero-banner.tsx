import { SearchBar } from "@/components/search-bar";

// Static single-band hero -- previously an auto-rotating 3-slide carousel
// (framer-motion, dot nav, 6s interval). Redesign spec calls for a flat,
// non-rotating banner instead: one headline, the search bar, done.
//
// Flat solid --brand fill -- previously a diagonal gradient fading to a
// near-black corner (navy, then teal-hued near-black, before the gradient
// was dropped entirely for a flat fill). --header-bg above it stays a
// distinct, deeper shade so the two bands still read apart.
// Bottom padding (pb-20/sm:pb-24) is deliberately taller than the top
// (pt-10/sm:pt-14) -- extra brand-colored space below the search bar
// before the band hands off to the white listings section, per spec.
export function HeroBanner() {
  return (
    <div className="w-full bg-brand">
      <div className="mx-auto flex max-w-7xl flex-col items-center px-4 pt-10 pb-20 text-center sm:px-6 sm:pt-14 sm:pb-24">
        <h1 className="text-lg font-extrabold leading-tight text-white drop-shadow-sm sm:text-xl lg:text-2xl xl:text-3xl">
          Ghana&apos;s Premium Marketplace
        </h1>
        <div className="mt-5 w-full max-w-xl sm:mt-6">
          <SearchBar />
        </div>
      </div>
    </div>
  );
}
