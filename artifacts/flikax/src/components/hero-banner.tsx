// Static single-band hero -- previously an auto-rotating 3-slide carousel
// (framer-motion, dot nav, 6s interval), then a flat headline + search bar
// band. The search bar has since moved up into SiteHeader itself (Tonaton-
// style, embedded in the sticky green bar on every page), so this is just
// the headline now -- padding is symmetric top/bottom rather than the old
// taller bottom pad that used to leave room under the search bar.
//
// Flat solid --brand fill -- previously a diagonal gradient fading to a
// near-black corner (navy, then teal-hued near-black, before the gradient
// was dropped entirely for a flat fill). --header-bg above it stays a
// distinct, deeper shade so the two bands still read apart.
export function HeroBanner() {
  return (
    <div className="w-full bg-brand">
      <div className="mx-auto flex max-w-7xl flex-col items-center px-4 py-10 text-center sm:px-6 sm:py-14">
        {/* text-xl, not text-lg, at the base size -- white-on-brand here
            measures 3.66:1, which clears WCAG's 3:1 floor for bold "large
            text" (>=14pt/18.66px bold) but not the 4.5:1 floor for normal-
            size text. text-lg (18px) sits just under that large-text cutoff;
            text-xl (20px) clears it, so the same white-on-brand pairing
            passes without darkening the band (see the comment above about
            --header-bg staying visually distinct from this band's --brand). */}
        <h1 className="text-xl font-extrabold leading-tight text-white drop-shadow-sm sm:text-2xl lg:text-3xl xl:text-4xl">
          Ghana&apos;s Premium Marketplace
        </h1>
      </div>
    </div>
  );
}
