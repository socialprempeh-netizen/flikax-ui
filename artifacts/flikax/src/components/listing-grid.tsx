import Link from "next/link";
import Image from "next/image";
import { ImageOff, Star, TrendingUp, MapPin, Clock } from "lucide-react";
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
};

const currency = new Intl.NumberFormat("en-GH", {
  style: "currency",
  currency: "GHS",
  maximumFractionDigits: 0,
});

// Caps how tall a single card's image can get before object-cover starts
// cropping it -- without this, an extreme portrait photo would blow out
// its column and dominate the whole grid.
const MAX_IMAGE_HEIGHT = 560;

// CSS multi-column masonry, not a CSS Grid: cards keep each listing's real
// image aspect ratio (see hasNaturalAspect below), which means different
// heights per card by design -- a strict grid forces every row to the
// height of its tallest cell, which is what left gaps under the shorter
// cards. `columns` lays cards out column-by-column instead, so each column
// packs tightly regardless of what height the others' cards end up at.
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
        <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-neutral-300 bg-white py-16 text-center">
          <p className="text-sm font-medium text-neutral-600">No listings match your filters.</p>
          <p className="text-sm text-neutral-400">Try a different search, category, or price range.</p>
        </div>
      </section>
    );
  }

  const isHome = variant === "home";

  return (
    <section className="flex-1">
      <div className={isHome ? "columns-2 gap-4 sm:columns-3 lg:columns-4" : "columns-2 gap-4 sm:columns-2 lg:columns-3"}>
        {listings.map((listing) => {
          const hasNaturalAspect = Boolean(listing.imageWidth && listing.imageHeight);

          return (
            <Link key={listing.id} href={listing.href} className="mb-4 block break-inside-avoid">
              <ListingCardHover>
              <Card className="gap-0 overflow-hidden rounded-2xl border-2 border-neutral-200 p-0 shadow-sm transition-shadow duration-200 group-hover:border-brand group-hover:shadow-xl">
                <div
                  className={`relative w-full overflow-hidden bg-cream text-brand/40 ${
                    hasNaturalAspect ? "" : isHome ? "aspect-[3/4]" : "aspect-[4/5]"
                  }`}
                  style={
                    hasNaturalAspect
                      ? { aspectRatio: `${listing.imageWidth} / ${listing.imageHeight}`, maxHeight: MAX_IMAGE_HEIGHT }
                      : undefined
                  }
                >
                  {listing.imageUrl ? (
                    <Image
                      src={listing.imageUrl}
                      alt={listing.title}
                      fill
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
                        <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 shadow-sm ring-1 ring-inset ring-amber-300">
                          <Star className="size-3 fill-amber-500 text-amber-500" />
                          Featured
                        </span>
                      )}
                      {listing.isBumped && (
                        <span className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 shadow-sm ring-1 ring-inset ring-blue-300">
                          <TrendingUp className="size-3 text-blue-600" />
                          Bumped
                        </span>
                      )}
                    </div>
                  )}
                  <CompactSaveButton listingId={listing.id} />
                </div>
                <CardContent className="space-y-1.5 p-3.5">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-extrabold tracking-tight text-brand">
                      {currency.format(listing.price)}
                    </span>
                    {listing.negotiable && (
                      <span className="rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-600">
                        Neg.
                      </span>
                    )}
                  </div>
                  <p className="line-clamp-2 text-[15px] font-bold leading-snug text-neutral-900">{listing.title}</p>
                  {listing.description && (
                    <p className="line-clamp-2 text-xs text-neutral-500">{listing.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="flex min-w-0 items-center gap-1 truncate rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
                      <MapPin className="size-3 shrink-0" />
                      <span className="truncate">{listing.location}</span>
                    </span>
                    {listing.createdAt && (
                      <span className="flex shrink-0 items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
                        <Clock className="size-3" />
                        {formatRelativeTime(new Date(listing.createdAt))}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
              </ListingCardHover>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
