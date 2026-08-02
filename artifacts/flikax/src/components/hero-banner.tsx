import { SearchBar } from "@/components/search-bar";

// Static single-band hero -- previously an auto-rotating 3-slide carousel
// (framer-motion, dot nav, 6s interval). Redesign spec calls for a flat,
// non-rotating banner instead: one headline, the search bar, done.
export function HeroBanner() {
  return (
    <div className="w-full bg-brand">
      <div className="mx-auto flex max-w-7xl flex-col items-center px-4 pt-8 pb-12 text-center sm:px-6 sm:pt-10 sm:pb-16">
        <h1 className="text-xl font-extrabold leading-tight text-white drop-shadow-sm sm:text-2xl lg:text-3xl xl:text-4xl">
          Ghana&apos;s Premium Marketplace
        </h1>
        <div className="mt-5 w-full max-w-xl sm:mt-6">
          <SearchBar />
        </div>
      </div>
    </div>
  );
}
