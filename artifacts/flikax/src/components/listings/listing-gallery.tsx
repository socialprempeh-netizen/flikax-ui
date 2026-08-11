"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImageOff, ChevronLeft, ChevronRight, Camera } from "lucide-react";

// Below this drag distance, a pointer down/up is treated as a tap/click
// (e.g. on the image itself) rather than an intentional swipe.
const SWIPE_THRESHOLD_PX = 50;

export function ListingGallery({ images, title }: { images: string[]; title: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const dragStartX = useRef<number | null>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  if (images.length === 0) {
    // No `w-full` here alongside `-mx-4` -- with an explicit width AND both
    // margins specified, CSS treats the box as over-constrained and (in LTR)
    // silently discards the specified margin-right to make the equation
    // balance, so only the left edge would actually reach the screen edge.
    // Leaving width unset lets it resolve from the margin equation instead,
    // which extends evenly on both sides.
    return (
      <div className="-mx-4 flex aspect-[4/3] items-center justify-center rounded-none border-0 bg-cream text-brand-dark/40 sm:mx-0 sm:border sm:border-slate-200/80 sm:border-t-4 sm:border-t-brand">
        <ImageOff className="size-10" />
      </div>
    );
  }

  function prev() {
    setActiveIndex((i) => (i - 1 + images.length) % images.length);
  }

  function next() {
    setActiveIndex((i) => (i + 1) % images.length);
  }

  // Jumps straight to a given slide and scrolls the main preview back into
  // view -- without this, picking a thumbnail while scrolled down past the
  // main image (common once the description/thumbnails push it off-screen
  // on mobile) silently updates a display the user can no longer see.
  function selectImage(index: number) {
    setActiveIndex(index);
    mainRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handlePointerDown(e: React.PointerEvent) {
    dragStartX.current = e.clientX;
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (dragStartX.current === null) return;
    const deltaX = e.clientX - dragStartX.current;
    dragStartX.current = null;
    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) return;
    if (deltaX > 0) prev();
    else next();
  }

  return (
    <div>
      {/* -mx-4 cancels the detail page's own px-4 edge padding below sm, so
          the hero photo runs flush to both screen edges (Jiji-style) --
          sm:mx-0 (plus the sm:border below) hands the card treatment back
          once there's room for it to read as a bordered card rather than a
          full-bleed photo. Deliberately no `w-full`: with an explicit width
          AND both margins specified, CSS treats the box as over-constrained
          and (in LTR) silently discards the specified margin-right to
          rebalance the equation, so only the left edge would actually reach
          the screen edge. Leaving width unset lets it resolve from the
          margin equation instead, extending it evenly on both sides --
          same reasoning as ListingGrid's card columns, which never set an
          explicit width on the -mx-4 element.
          rounded-none stays rounded-none at every breakpoint now -- this
          used to pick up sm:rounded-2xl on desktop, the one place a listing
          photo broke from the flat, square-cornered tile look every other
          image on the site (grid cards, thumbnails) already uses. */}
      <div
        ref={mainRef}
        className="relative -mx-4 aspect-[4/3] touch-pan-y select-none overflow-hidden rounded-none border-0 bg-cream sm:mx-0 sm:border sm:border-slate-200/80 sm:border-t-4 sm:border-t-brand"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => {
          dragStartX.current = null;
        }}
      >
        {/* A true sliding filmstrip (translateX on a flex row N-images wide)
            rather than a stacked opacity crossfade -- the row physically
            slides left/right in the direction of travel, which reads as a
            deliberate "next/prev" motion instead of a same-spot fade. */}
        <div
          className="flex h-full transition-transform duration-[400ms] ease-out"
          style={{
            width: `${images.length * 100}%`,
            transform: `translateX(-${activeIndex * (100 / images.length)}%)`,
          }}
        >
          {images.map((url, index) => (
            <div key={url + index} className="relative h-full shrink-0" style={{ width: `${100 / images.length}%` }}>
              <Image
                src={url}
                alt={index === activeIndex ? title : ""}
                fill
                // Only the first (LCP) image should skip lazy-loading.
                // This used to force loading="eager" on every *other* image
                // in the filmstrip too, which meant the browser preloaded
                // every photo in the gallery (10+ on a fully-populated
                // listing) at once, diluting bandwidth/priority away from
                // the one image that's actually above the fold on load.
                priority={index === 0}
                sizes="(min-width: 640px) 75vw, 100vw"
                quality={82}
                className="object-cover"
              />
            </div>
          ))}
        </div>
        {images.length > 1 && (
          <>
            {/* Standalone icons -- no circular/pill background -- with a
                drop-shadow standing in for that background's contrast job,
                so the arrow still reads against light and dark photos alike. */}
            <button
              type="button"
              onClick={prev}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 hidden -translate-y-1/2 text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)] transition-transform hover:scale-110 sm:flex"
            >
              <ChevronLeft className="size-8" strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next image"
              className="absolute right-3 top-1/2 hidden -translate-y-1/2 text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)] transition-transform hover:scale-110 sm:flex"
            >
              <ChevronRight className="size-8" strokeWidth={2.5} />
            </button>
            <span className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white sm:hidden">
              <Camera className="size-3.5" />
              {activeIndex + 1}/{images.length}
            </span>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-3 hidden grid-cols-4 gap-2.5 sm:grid">
          {images.map((url, index) => (
            <button
              key={url + index}
              type="button"
              onClick={() => selectImage(index)}
              aria-label={`View image ${index + 1}`}
              className={`relative aspect-square w-full overflow-hidden rounded-sm border-2 transition-all ${
                index === activeIndex
                  ? "border-brand shadow-md"
                  : "border-transparent opacity-80 hover:opacity-100"
              }`}
            >
              <Image src={url} alt="" fill sizes="180px" quality={82} className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
