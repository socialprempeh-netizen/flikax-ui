import Link from "next/link";
import Image from "next/image";
import { ImageOff, Star, TrendingUp, MapPin, Clock, BadgePercent, ShieldCheck } from "lucide-react";
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
};

const currency = new Intl.NumberFormat("en-GH", {
  style: "currency",
  currency: "GHS",
  maximumFractionDigits: 0,
});

// CSS Grid, not CSS multi-column masonry (`columns-*`) -- multi-column lays
// items out column-by-column (fills column 1 top-to-bottom, then column 2,
// ...), which packs variable-height cards tightly, but it also means the
// *visual* reading order no longer matches the DOM/query order: with 5
// columns, a human scanning left-to-right across the top row sees items
// 1, N+1, 2N+1, ... instead of 1, 2, 3, ... -- exactly backwards from what
// "recommended"/"newest" sort implies, and it desyncs keyboard tab order
// from visual position too. Grid keeps DOM order == visual reading order
// (row by row, left to right) at the cost of some unused space under
// shorter cards within the same row -- a small visual tradeoff. Cards
// still vary in height card-to-card (fixed square image + line-clamp'd
// title, but an optional line-clamp'd description excerpt below it -- see
// CardContent below), which is what gives the grid a masonry-like look
// despite being plain rows under the hood.
export function ListingGrid({
  listings,
  variant = "default",
}: {
  listings: ListingCard[];
  variant?: "default" | "home";
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
          a hairline gap. */}
      <div
        className={`grid -mx-4 gap-2 sm:mx-0 ${
          isHome ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" : "grid-cols-2 sm:grid-cols-2 lg:grid-cols-3"
        }`}
      >
        {listings.map((listing, index) => {
          return (
            <ListingCardHover key={listing.id}>
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
                  {/* Square, not the image's natural aspect ratio -- keeps every
                      card in the grid the same shape (Jiji-style), even though
                      imageWidth/imageHeight are still tracked for other uses
                      (e.g. the detail page gallery). */}
                  <div className="relative aspect-square w-full overflow-hidden bg-cream text-brand-dark/40">
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
                    {(listing.isFeatured || listing.isBumped) && (
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
                      </div>
                    )}
                    {listing.originalPrice != null && (
                      <span className="absolute right-2 top-2 flex items-center gap-0.5 rounded-full bg-rose-600 px-2 py-0.5 text-3xs font-bold text-white shadow-sm">
                        <BadgePercent className="size-3" />
                        {Math.round((1 - listing.price / listing.originalPrice) * 100)}% OFF
                      </span>
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
                    <p className="line-clamp-2 text-13 font-bold leading-snug text-neutral-900">
                      {listing.title}
                    </p>
                    {/* Optional excerpt -- only when the seller actually wrote a
                        description (~15% of listings have none). This, not the
                        grid CSS, is what gives the layout real masonry variation:
                        a bare 1-3 word description clamps to one line, a longer
                        one to three, so card heights differ card-to-card instead
                        of every card being the same fixed height. */}
                    {listing.description?.trim() && (
                      <p className="line-clamp-3 text-xs leading-snug text-neutral-500">{listing.description}</p>
                    )}
                    <div className="flex items-center gap-1 pt-0.5 text-2xs text-neutral-500">
                      <MapPin className="size-3 shrink-0" />
                      <span className="min-w-0 truncate">{listing.location}</span>
                      {listing.isVerifiedSeller && (
                        <ShieldCheck className="size-3 shrink-0 fill-blue-100 text-blue-600" aria-label="Verified seller" />
                      )}
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
