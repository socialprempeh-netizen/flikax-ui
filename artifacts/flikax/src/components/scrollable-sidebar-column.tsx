"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

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

  return (
    <div className="relative flex w-full shrink-0 lg:sticky lg:top-16 lg:z-10 lg:w-72 lg:self-start">
      <div
        ref={innerRef}
        className="flex w-full flex-col gap-3 lg:max-h-[calc(100vh-5rem)] lg:overflow-y-auto lg:no-scrollbar"
      >
        {children}
      </div>
      {showMore && (
        <div className="pointer-events-none absolute inset-x-0 bottom-1 z-10 hidden justify-center lg:flex">
          <span className="flex size-7 items-center justify-center rounded-full border border-slate-200/80 bg-white text-neutral-500 shadow-md">
            <ChevronDown className="size-4" />
          </span>
        </div>
      )}
    </div>
  );
}
