"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SearchBar } from "@/components/search-bar";

type HeroSlide = {
  headline: string;
  gradient: string;
};

// No illustration graphic here (removed -- see hero-banner.tsx git history):
// with the row using items-center, the illustration's own height (~155px)
// was taller than the headline+dot-nav text block (~65px), so it silently
// dictated the whole band's height and pushed the absolutely-positioned
// search bar overlay far down from the visual content above it. Dropping it
// also matches the Jiji reference this hero is modeled on, which has no
// illustration either -- just headline/prompt + search on a flat color.
const SLIDES: HeroSlide[] = [
  { headline: "Find Anything in Ghana", gradient: "from-[#0B1B33] via-[#124F9E] to-brand" },
  { headline: "Sell Your Items Fast", gradient: "from-brand via-[#1868DB] to-[#3C8CE7]" },
  { headline: "Drive Your Dream Car", gradient: "from-neutral-900 via-neutral-800 to-[#124F9E]" },
];

const AUTO_MS = 6000;

export function HeroBanner() {
  const [[index, direction], setSlide] = useState<[number, number]>([0, 0]);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback((next: number) => {
    setSlide(([current]) => {
      const normalized = ((next % SLIDES.length) + SLIDES.length) % SLIDES.length;
      return [normalized, normalized > current || (current === SLIDES.length - 1 && normalized === 0) ? 1 : -1];
    });
  }, []);

  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(() => goTo(index + 1), AUTO_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, index]);

  const slide = SLIDES[index];

  return (
    <div
      // Persistent navy backdrop, not just the animated slide's own gradient:
      // AnimatePresence mode="wait" briefly fades the outgoing slide to
      // opacity 0 before the incoming one fades in, which would otherwise
      // flash the plain page background through the gap.
      className="relative w-full overflow-hidden bg-[#0B1B33]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={index}
          custom={direction}
          initial={{ opacity: 0, x: direction >= 0 ? 48 : -48 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction >= 0 ? -48 : 48 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          className={`relative bg-gradient-to-r ${slide.gradient}`}
        >
          {/* Bottom padding reserves room for the search bar overlay below --
              sized to its real height plus roughly the same margin as the
              headline/dot-nav's own spacing above, so the search bar ends up
              vertically centered in the band with comfortable room on both
              sides, not crammed against the bottom edge. */}
          <div className="relative mx-auto flex max-w-7xl flex-col items-center px-4 pt-8 pb-16 text-center sm:px-6 sm:pt-9 sm:pb-20 lg:pt-10 lg:pb-20">
            <h1 className="text-xl font-extrabold leading-tight text-white drop-shadow-sm sm:text-2xl lg:text-3xl xl:text-4xl">
              {slide.headline}
            </h1>
            {/* Dot nav */}
            <div className="mt-4 flex items-center gap-1.5">
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    i === index ? "w-6 bg-white" : "w-1 bg-white/45 hover:bg-white/65"
                  }`}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Centered search bar overlapping the tail end of the gradient --
          intentionally a sibling of AnimatePresence, not inside the
          per-slide motion.div, so it never unmounts (and never loses
          in-progress focus/typing) as slides rotate underneath it. */}
      <div className="absolute inset-x-0 bottom-5 z-20 flex w-full justify-center px-4 sm:bottom-6 sm:px-6 lg:bottom-7">
        <div className="w-full max-w-xl">
          <SearchBar />
        </div>
      </div>
    </div>
  );
}
