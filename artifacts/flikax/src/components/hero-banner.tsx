import { SearchBar } from "@/components/search-bar";

// Static single-band hero -- previously an auto-rotating 3-slide carousel
// (framer-motion, dot nav, 6s interval). One headline, the search bar,
// done.
//
// Flat solid --brand fill -- previously a diagonal gradient fading to a
// near-black corner (navy, then teal-hued near-black, before the gradient
// was dropped entirely for a flat fill). --header-bg above it stays a
// distinct, deeper shade so the two bands still read apart.
//
// Fixed 250px height (Tonaton's measured reference height) with the
// heading + search bar centered inside it, rather than letting generous
// top/bottom padding set the band's height implicitly.
export function HeroBanner() {
  return (
    <div className="w-full bg-brand">
      <div className="mx-auto flex h-[250px] max-w-7xl flex-col items-center justify-center px-4 py-4 text-center sm:px-6 md:py-6">
        {/* text-xl, not text-lg, at the base size -- white-on-brand here
            measures 3.66:1, which clears WCAG's 3:1 floor for bold "large
            text" (>=14pt/18.66px bold) but not the 4.5:1 floor for normal-
            size text. text-lg (18px) sits just under that large-text cutoff;
            text-xl (20px) clears it, so the same white-on-brand pairing
            passes without darkening the band (see the comment above about
            --header-bg staying visually distinct from this band's --brand). */}
        <h1 className="mb-3 text-xl font-extrabold leading-tight text-white drop-shadow-sm sm:text-2xl lg:text-3xl xl:text-4xl md:mb-4">
          Ghana&apos;s Premium Marketplace
        </h1>
        <div className="w-full max-w-xl">
          <SearchBar />
        </div>
      </div>
    </div>
  );
}
