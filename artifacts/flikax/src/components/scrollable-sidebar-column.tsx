"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

// How far a single arrow click nudges the list -- roughly two and a half
// category rows, not an all-the-way jump, matching Jiji's "reveal a bit
// more" click behavior rather than a scroll-to-bottom button.
const CLICK_SCROLL_PX = 220;

// Wraps the category sidebar's sticky + internally-scrolling column and
// layers a floating "more below" chevron over its bottom edge whenever
// content overflows -- Jiji's own scroll-indicator convention (see the
// sidebar's no-scrollbar utility for why there's no visible scrollbar to
// serve that same purpose here).
//
// Sizing/position classes (w-72, sticky, top-16, self-start) live on this
// OUTER element -- it's the actual flex item the page's row layout sees.
// Only the INNER div scrolls, so the arrow (a sibling, not a scrolled
// child) can sit absolutely pinned to the visible bottom edge regardless
// of scroll position, rather than moving with the scrolled content.
export function ScrollableSidebarColumn({ children }: { children: React.ReactNode }) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;

    // A few pixels of slack so sub-pixel rounding never leaves the arrow
    // stuck visible once the user has genuinely scrolled to the bottom.
    function update() {
      setShowMore(el!.scrollHeight - el!.scrollTop - el!.clientHeight > 8);
    }

    update();
    el.addEventListener("scroll", update, { passive: true });
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      resizeObserver.disconnect();
    };
  }, []);

  function handleArrowClick() {
    innerRef.current?.scrollBy({ top: CLICK_SCROLL_PX, behavior: "smooth" });
  }

  return (
    <div className="relative flex w-full shrink-0 lg:sticky lg:top-16 lg:z-10 lg:w-72 lg:self-start">
      <div
        ref={innerRef}
        className="flex w-full flex-col gap-3 lg:max-h-[calc(100vh-5rem)] lg:overflow-y-auto lg:no-scrollbar"
      >
        {children}
      </div>
      {showMore && (
        // Sits a little inside the box (bottom-3, not flush against the
        // edge) over a soft upward fade so it reads as part of the panel's
        // own chrome rather than a stray badge clipped by the border.
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 hidden justify-center pb-3 lg:flex">
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 rounded-b-2xl bg-gradient-to-t from-white to-transparent" />
          <button
            type="button"
            onClick={handleArrowClick}
            aria-label="Scroll to see more categories"
            className="pointer-events-auto relative flex size-7 items-center justify-center rounded-full border border-slate-200/80 bg-white text-neutral-500 shadow-md transition-all hover:scale-110 hover:text-brand-dark hover:shadow-lg"
          >
            <ChevronDown className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}
