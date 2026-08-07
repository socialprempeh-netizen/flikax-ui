import { SearchBar } from "@/components/search-bar";

// Static single-band hero -- previously an auto-rotating 3-slide carousel
// (framer-motion, dot nav, 6s interval). Redesign spec calls for a flat,
// non-rotating banner instead: one headline, the search bar, done.
//
// Background is a diagonal blue gradient (deep navy corner anchored to
// --hero-bg so it still reads as part of the same palette, brightening
// toward --brand in the opposite corner), not a flat fill -- this is
// deliberately a richer surface than the flat --header-bg above it, so the
// two still read as distinct bands even though both are now solid blue.
export function HeroBanner() {
  return (
    <div className="w-full bg-gradient-to-br from-[#0b1426] via-[#14276b] to-[#2554e8]">
      <div className="mx-auto flex max-w-7xl flex-col items-center px-4 pt-10 pb-16 text-center sm:px-6 sm:pt-14 sm:pb-20">
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
