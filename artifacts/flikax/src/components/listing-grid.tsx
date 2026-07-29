import Link from "next/link";
import Image from "next/image";
import { ImageOff, Star, TrendingUp, MapPin, Clock } from "lucide-react";
import { formatRelativeTime } from "@/lib/format-time";
import { CompactSaveButton } from "@/components/listings/compact-save-button";
import { Card, CardContent } from "@/components/ui/card";

export type ListingCard = {
  id: string;
  href: string;
  title: string;
  description?: string | null;
  price: number;
  location: string;
  imageUrl: string | null;
  // Cover image's real, stored dimensions. No longer used to size the card
  // (see aspect-square below) -- kept on the type since callers still pass
  // it, but every card now crops to the same fixed ratio regardless of the
  // source photo's real proportions. A per-listing natural aspect ratio in
  // a fixed (non-masonry) grid produced a different card height per photo,
  // which left ragged gaps under the shorter cards in every row (the grid
  // cell stretches to the row's tallest cell, but a shorter card doesn't
  // stretch with it) -- a uniform crop is what actually guarantees flush
  // rows with no gaps.
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

// "home" is the homepage grid: per the brief. "default" (everywhere else --
// category/search results) gets a bigger card via fewer grid columns and a
// heavier shadow/border instead.
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
      <div
        className={
          isHome
            ? "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
            : "grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        }
      >
        {listings.map((listing) => {
          return (
            <Link key={listing.id} href={listing.href} className="group block h-full">
              <Card className="h-full gap-0 overflow-hidden border-neutral-200 p-0 shadow-sm transition-all duration-200 group-hover:-translate-y-1 group-hover:border-brand/30 group-hover:shadow-xl">
                <div className="relative aspect-square w-full overflow-hidden bg-cream text-brand/40">
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
                        <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 shadow-sm">
                          <Star className="size-3 fill-amber-500 text-amber-500" />
                          Featured
                        </span>
                      )}
                      {listing.isBumped && (
                        <span className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 shadow-sm">
                          <TrendingUp className="size-3 text-blue-600" />
                          Bumped
                        </span>
                      )}
                    </div>
                  )}
                  <CompactSaveButton listingId={listing.id} />
                </div>
                <CardContent className="space-y-1 p-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-extrabold text-brand">{currency.format(listing.price)}</span>
                    {listing.negotiable && (
                      <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500">
                        Neg.
                      </span>
                    )}
                  </div>
                  {/* min-h reserves space for a full 2 lines regardless of
                      actual title/description length -- a short one-line
                      title next to a wrapped two-line one is the same kind
                      of per-card height variance as the image aspect ratio
                      was, just smaller, so it gets the same fixed-space
                      treatment to keep every card in a row pixel-identical. */}
                  <p className="line-clamp-2 min-h-10 text-sm font-semibold text-neutral-800">{listing.title}</p>
                  <p className="line-clamp-2 min-h-8 text-xs text-neutral-500">{listing.description ?? ""}</p>
                  <div className="flex items-center justify-between gap-2 pt-0.5 text-xs text-neutral-400">
                    <span className="flex min-w-0 items-center gap-1 truncate">
                      <MapPin className="size-3 shrink-0" />
                      <span className="truncate">{listing.location}</span>
                    </span>
                    {listing.createdAt && (
                      <span className="flex shrink-0 items-center gap-1">
                        <Clock className="size-3" />
                        {formatRelativeTime(new Date(listing.createdAt))}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
