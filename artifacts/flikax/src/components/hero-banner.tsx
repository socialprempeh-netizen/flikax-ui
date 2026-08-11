import { SearchBar } from "@/components/search-bar";

// Static single-band hero -- previously an auto-rotating 3-slide carousel
// (framer-motion, dot nav, 6s interval). Redesign spec calls for a flat,
// non-rotating banner instead: one headline, the search bar, done.
//
// Background is a diagonal teal gradient (deep near-black corner anchored to
// --hero-bg so it still reads as part of the same palette, brightening
// toward --brand in the opposite corner), not a flat fill -- this is
// deliberately a richer surface than the flat --header-bg above it, so the
// two still read as distinct bands even though both are now solid teal.
// Rebranded from a navy gradient (#0b1426 -> #14276b -> #2554e8); the
// middle stop (#0e5d62) is a same-hue interpolation, not the CSS var, since
// gradient stops need a literal value Tailwind can compile.
export function HeroBanner() {
  return (
    <div className="w-full bg-gradient-to-br from-[#081f21] via-[#0e5d62] to-[#06949e]">
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
