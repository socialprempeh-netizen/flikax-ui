import Link from "next/link";
import Image from "next/image";
import { ImageOff, Star, TrendingUp, MapPin, Clock, BadgePercent, ShieldCheck, Award } from "lucide-react";
import { formatRelativeTime } from "@/lib/format-time";
import { CompactSaveButton } from "@/components/listings/compact-save-button";
import { Card, CardContent } from "@/components/ui/card";
import { ListingCardHover } from "@/components/listing-card-hover";

export type ListingCard = {
  id: string;
  href: string;
  title: string;
  description?: string | null;
  price: number;
  location: string;
  imageUrl: string | null;
  // Cover image's real, stored dimensions -- present for new uploads,
  // null/undefined for images uploaded before this was tracked. Drives
  // rendering the card's image at its true aspect ratio instead of a
  // forced crop; missing either one falls back to the fixed crop.
  imageWidth?: number | null;
  imageHeight?: number | null;
  isFeatured?: boolean;
  isBumped?: boolean;
  negotiable?: boolean;
  createdAt?: string;
  // Set only when the seller recorded a higher original_price than the current
  // price (is_discounted, computed in the DB -- see the migration) -- null/undefined
  // means "not on sale", not "unknown", so callers can render on presence alone.
  originalPrice?: number | null;
  isVerifiedSeller?: boolean;
  // Pre-launch scaffolding: no fetcher populates this yet (there's no
  // meaningful "years on Flikax" for any seller at launch), but the badge
  // below is wired up and gracefully renders nothing when it's absent --
  // ready to light up once there's real seller-tenure data to pass in,
  // with no card-layout changes needed at that point.
  yearsOnFlikax?: number | null;
};

const currency = new Intl.NumberFormat("en-GH", {
  style: "currency",
  currency: "GHS",
  maximumFractionDigits: 0,
});

// Known acronyms/abbreviations that should stay fully uppercase in a
// title-cased card title instead of getting mangled into "Suv"/"Awd"/"Cr-V".
// Matched whole-word and case-insensitively (so a seller typing "cr-v" or
// "Cr-V" still comes out "CR-V"), not as a substring -- "GLS600" doesn't
// match "GLS" here, it just falls through to normal title-casing as
// "Gls600", since partial matching would risk false-positiving on
// unrelated words that happen to contain one of these as a prefix.
// Car listings are the bulk of this site's inventory, hence the heavy lean
// toward vehicle spec terms -- extend as new ones show up in real listings
// rather than trying to enumerate every possible one up front.
const KNOWN_ACRONYMS = new Set([
  "SUV",
  "AWD",
  "FWD",
  "RWD",
  "4WD",
  "4X4",
  "CR-V",
  "GLS",
  "GLE",
  "GLC",
  "GLA",
  "AMG",
  "ABS",
  "V4",
  "V6",
  "V8",
  "4CYL",
  "6CYL",
  "API",
  "HTML",
  "GPS",
  "LED",
  "USB",
  "TV",
  "AC",
  "AI",
]);

// Applied to every title unconditionally (not just ones typed fully in
// caps) so every card reads with the same uniform, initial-caps Title Case
// regardless of how the seller originally typed it -- all caps, all
// lowercase, or spotty capitalization -- while KNOWN_ACRONYMS above keeps
// the specific terms that are supposed to stay uppercase from getting
// lowercased along with everything else.
function toReadableTitle(title: string): string {
  return title
    .split(" ")
    .map((word) => {
      if (KNOWN_ACRONYMS.has(word.toUpperCase())) return word.toUpperCase();
      return word.toLowerCase().replace(/(^|-)([a-z])/g, (_, sep: string, ch: string) => sep + ch.toUpperCase());
    })
    .join(" ");
}

// CSS multi-column (`columns-*`), matching Jiji's actual masonry -- each
// column fills top-to-bottom independently (item 2 stacks under item 1 in
// column 1 until that column's next item would overflow, then continues in
// column 2), which is what lets cards of genuinely different heights
// (variable-aspect images below, plus the optional description excerpt)
// pack tightly with no dead space under short cards, instead of every card
// in a row being stretched/padded to match its tallest neighbor.
//
// Previously this was CSS Grid specifically to keep visual reading order
// row-by-row == DOM/query order == keyboard tab order -- multi-column's
// column-major fill breaks that (a 5-column top row reads item 1, then
// whatever landed after column 1 filled, not item 2). Switched anyway,
// deliberately, to match the reference: that's an inherent, unavoidable
// property of *any* real masonry layout (a JS packing library reorders
// visually the same way -- shortest-column-next -- since preserving strict
// row-major order is what a uniform grid guarantees and masonry, by
// definition, does not), not a bug specific to this implementation.
export function ListingGrid({
  listings,
  variant = "default",
  layout = "grid",
}: {
  listings: ListingCard[];
  variant?: "default" | "home";
  /** "list" is the category-page view switcher's other mode -- same cards,
   * forced to a single full-width column instead of the masonry columns
   * below, regardless of breakpoint. */
  layout?: "grid" | "list";
}) {
  if (listings.length === 0) {
    return (
      <section className="flex-1">
        <div className="flex flex-col items-center justify-center gap-1 border border-dashed border-neutral-300 bg-white py-16 text-center">
          <p className="text-sm font-medium text-neutral-600">No listings match your filters.</p>
          <p className="text-sm text-neutral-400">Try a different search, category, or price range.</p>
        </div>
      </section>
    );
  }

  const isHome = variant === "home";

  return (
    <section className="flex-1">
      {/* -mx-4 cancels the page's own px-4 edge padding below sm, so listing
          images run flush to the screen edges (Jiji-style) on mobile; sm:mx-0
          hands padding back to the page container once it's no longer just
          a hairline gap. gap-x-2 is column-gap only -- multi-column's
          row-gap-between-stacked-items support is newer (Chrome 84+/Safari
          14.1+) and this codebase would rather not depend on it for
          something as basic as card spacing, so vertical spacing between
          stacked cards in the same column comes from mb-2 on each card
          instead (below), which every browser handles identically. */}
      <div
        className={`-mx-4 gap-x-2 sm:mx-0 ${
          layout === "list" ? "columns-1" : `columns-2 ${isHome ? "sm:columns-3 lg:columns-4 xl:columns-5" : "sm:columns-2 lg:columns-3"}`
        }`}
      >
        {listings.map((listing, index) => {
          // Real stored aspect ratio when known (falls back to square for
          // images uploaded before dimensions were tracked), clamped to a
          // sane portrait/landscape range so one unusually extreme photo
          // (a panorama, a screenshot) can't produce a grotesquely
          // tall/short card -- Jiji's own masonry has natural, bounded
          // variation, not extremes.
          const rawRatio =
            listing.imageWidth && listing.imageHeight ? listing.imageWidth / listing.imageHeight : 1;
          const aspectRatio = Math.min(Math.max(rawRatio, 0.65), 1.6);
          return (
            <ListingCardHover key={listing.id} className="mb-2 break-inside-avoid">
              {/* relative: anchors CompactSaveButton, which needs to be a
                  sibling of the Link (not a descendant) -- a <button>
                  nested inside an <a> is invalid HTML (interactive content
                  can't nest), and browsers/screen readers surfaced it as two
                  separate tab stops for what should read as one card + one
                  overlay control. Positioned the same as before (top-1
                  right-1) since this div, like the old Link, sits flush
                  against the image with zero padding above/around it. */}
              <div className="relative">
                <Link href={listing.href} className="block">
                {/* rounded-none, not rounded-lg -- Card's own base class is
                    rounded-xl, and a smaller radius is still a rounded corner.
                    The reference grid (Jiji-style) uses flat, perfectly square
                    tiles with hairline borders between them instead.
                    bg-white, not bg-neutral-200 -- that grey was nearly the
                    exact same shade as the page's own --background (#e4e7eb
                    vs #e5e5e5), which is why cards barely stood out from the
                    page. A white card + a slightly stronger border/shadow
                    reads as a clearly separate surface instead. */}
                <Card
                  className={`gap-0 overflow-hidden bg-white p-0 shadow-[0_1px_4px_rgba(0,0,0,0.1)] transition-shadow duration-200 group-hover:shadow-lg ${
                    listing.isFeatured
                      ? "border-amber-300"
                      : listing.isBumped
                        ? "border-blue-300"
                        : "border-neutral-300"
                  }`}
                >
                  {/* Real stored aspect ratio (clamped above), not a forced
                      square -- this is what actually varies card heights for
                      the masonry effect (Jiji-style); falls back to a square
                      for pre-dimension-tracking images. */}
                  <div
                    className="relative w-full overflow-hidden bg-cream text-brand-dark/40"
                    style={{ aspectRatio }}
                  >
                    {listing.imageUrl ? (
                      <Image
                        src={listing.imageUrl}
                        alt={listing.title}
                        fill
                        // The first card is consistently the page's LCP
                        // element (it's the largest thing painted, above the
                        // fold on every breakpoint) -- priority drops the
                        // default loading="lazy" and adds fetchpriority="high"
                        // so the browser requests it immediately instead of
                        // waiting on layout to confirm it's in the viewport.
                        // Tried prioritizing home's first *two* cards after a
                        // single measurement suggested the second was the new
                        // LCP candidate -- reverted after re-measuring live
                        // 3x post-deploy: LCP got *worse* (5.0s -> ~10s),
                        // while category (still single-priority, unchanged)
                        // stayed fine, isolating the cause to this change --
                        // two competing high-fetchpriority image requests
                        // diluted each other rather than the browser clearly
                        // winning on either. One clear priority image per
                        // page, every other card keeps default lazy loading.
                        priority={index === 0}
                        sizes={
                          isHome
                            ? "(min-width: 1024px) 22vw, (min-width: 640px) 30vw, 45vw"
                            : "(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 45vw"
                        }
                        quality={82}
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center">
                        <ImageOff className="size-8" />
                      </div>
                    )}
                    {(listing.isFeatured || listing.isBumped || listing.yearsOnFlikax) && (
                      <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
                        {listing.isFeatured && (
                          <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-3xs font-bold text-amber-700 shadow-sm ring-1 ring-inset ring-amber-300">
                            <Star className="size-3 fill-amber-500 text-amber-500" />
                            Featured
                          </span>
                        )}
                        {listing.isBumped && (
                          <span className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-3xs font-bold text-blue-700 shadow-sm ring-1 ring-inset ring-blue-300">
                            <TrendingUp className="size-3 text-blue-600" />
                            Bumped
                          </span>
                        )}
                        {/* Pre-launch scaffolding -- see yearsOnFlikax's own
                            comment on the type above. */}
                        {listing.yearsOnFlikax != null && listing.yearsOnFlikax > 0 && (
                          <span className="flex items-center gap-1 rounded-full bg-neutral-900/75 px-2 py-0.5 text-3xs font-bold text-white shadow-sm">
                            <Award className="size-3 text-amber-300" />
                            {listing.yearsOnFlikax}+ Years on Flikax
                          </span>
                        )}
                      </div>
                    )}
                    {(listing.originalPrice != null || listing.isVerifiedSeller) && (
                      // top-14, not top-2 -- CompactSaveButton (the heart) is a
                      // size-11 circle at top-1 on this same corner (rendered
                      // as a sibling outside this image container, but visually
                      // the same corner since the image sits flush with zero
                      // padding above it), so top-2 would sit the badge right
                      // underneath/behind that glass button instead of below it.
                      <div className="absolute right-2 top-14 flex flex-col items-end gap-1">
                        {listing.originalPrice != null && (
                          <span className="flex items-center gap-0.5 rounded-full bg-rose-600 px-2 py-0.5 text-3xs font-bold text-white shadow-sm">
                            <BadgePercent className="size-3" />
                            {Math.round((1 - listing.price / listing.originalPrice) * 100)}% OFF
                          </span>
                        )}
                        {listing.isVerifiedSeller && (
                          <span className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-3xs font-bold text-blue-700 shadow-sm ring-1 ring-inset ring-blue-300">
                            <ShieldCheck className="size-3 fill-blue-200 text-blue-600" />
                            Verified
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <CardContent className="space-y-1 p-3.5">
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-currency text-lg font-extrabold tracking-tight text-brand-dark">
                        {currency.format(listing.price)}
                      </span>
                      {listing.originalPrice != null && (
                        <span className="font-currency text-2xs font-medium text-neutral-400 line-through">
                          {currency.format(listing.originalPrice)}
                        </span>
                      )}
                      {listing.negotiable && (
                        <span className="text-2xs font-medium text-neutral-400">Neg.</span>
                      )}
                    </div>
                    {/* text-sm (14px), a size step above the 13px description --
                        together with font-bold + near-black vs. the
                        description's regular weight + neutral-500, this is
                        what actually separates "title" from "body copy" at a
                        glance instead of the two reading as the same tier of
                        text with only a color difference. toReadableTitle
                        fixes seller-typed ALL-CAPS titles (see its own
                        comment) without touching already-fine mixed-case
                        ones. */}
                    <p className="line-clamp-2 text-sm font-bold leading-snug text-neutral-900">
                      {toReadableTitle(listing.title)}
                    </p>
                    {/* Optional excerpt -- only when the seller actually wrote a
                        description (~15% of listings have none). This, not the
                        grid CSS, is what gives the layout real masonry variation:
                        a bare 1-3 word description clamps to one line, a longer
                        one to three, so card heights differ card-to-card instead
                        of every card being the same fixed height. line-clamp-3
                        is the literal -webkit-line-clamp: 3 truncation (plus
                        -webkit-box-orient/overflow) that keeps the excerpt at a
                        strict 3-line max with a trailing ellipsis on overflow. */}
                    {listing.description?.trim() && (
                      <p className="line-clamp-3 text-13 leading-snug text-neutral-500">{listing.description}</p>
                    )}
                    {/* isVerifiedSeller now also renders as its own corner
                        badge above (top-right, alongside %OFF) -- dropped the
                        second inline ShieldCheck that used to sit here too,
                        since showing the same signal twice on one card was
                        redundant rather than reinforcing. */}
                    <div className="flex items-center gap-1 pt-0.5 text-2xs text-neutral-500">
                      <MapPin className="size-3.5 shrink-0 text-neutral-400" />
                      <span className="min-w-0 truncate">{listing.location}</span>
                      {listing.createdAt && (
                        <>
                          <span className="shrink-0 text-neutral-300">•</span>
                          <span className="flex shrink-0 items-center gap-0.5">
                            <Clock className="size-3" />
                            {formatRelativeTime(new Date(listing.createdAt))}
                          </span>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
                </Link>
                <CompactSaveButton listingId={listing.id} />
              </div>
            </ListingCardHover>
          );
        })}
      </div>
    </section>
  );
}
