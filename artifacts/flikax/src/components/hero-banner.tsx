"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { SearchBar } from "@/components/search-bar";

type HeroSlide = {
  badge: string;
  headline: string;
  cta: { label: string; href: string };
  ctaSecondary?: { label: string; href: string };
  gradient: string;
  illustration: ReactNode;
};

const SLIDES: HeroSlide[] = [
  {
    badge: "🇬🇭 Live in Ghana · 100k+ active ads",
    headline: "Find Anything in Ghana",
    cta: { label: "Explore Deals →", href: "/" },
    ctaSecondary: { label: "How it works", href: "/how-it-works" },
    gradient: "from-[#0B1B33] via-[#124F9E] to-brand",
    illustration: (
      <svg viewBox="0 0 260 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
        {/* Phone frame */}
        <rect x="60" y="10" width="100" height="165" rx="14" fill="white" fillOpacity="0.18" />
        <rect x="64" y="14" width="92" height="157" rx="11" fill="white" fillOpacity="0.22" />
        {/* Screen content */}
        <rect x="70" y="28" width="80" height="10" rx="3" fill="white" fillOpacity="0.55" />
        <rect x="70" y="44" width="80" height="38" rx="6" fill="white" fillOpacity="0.35" />
        <rect x="74" y="48" width="32" height="18" rx="3" fill="white" fillOpacity="0.4" />
        <rect x="112" y="48" width="32" height="18" rx="3" fill="white" fillOpacity="0.4" />
        <rect x="70" y="88" width="80" height="38" rx="6" fill="white" fillOpacity="0.35" />
        <rect x="74" y="92" width="32" height="18" rx="3" fill="white" fillOpacity="0.4" />
        <rect x="112" y="92" width="32" height="18" rx="3" fill="white" fillOpacity="0.4" />
        {/* Verified badge */}
        <circle cx="198" cy="38" r="24" fill="white" fillOpacity="0.15" />
        <circle cx="198" cy="38" r="16" fill="white" fillOpacity="0.25" />
        <path d="M191 38l5 5 11-11" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Floating price tag */}
        <rect x="170" y="90" width="72" height="28" rx="8" fill="white" fillOpacity="0.95" />
        <text x="182" y="109" fontFamily="system-ui" fontSize="11" fontWeight="700" fill="#1868DB">GH₵ 1,200</text>
        {/* Star */}
        <circle cx="30" cy="50" r="18" fill="white" fillOpacity="0.15" />
        <path d="M30 42l2.5 5h5.5l-4.5 3.5 1.5 5.5L30 53l-5 3 1.5-5.5L22 47h5.5z" fill="white" fillOpacity="0.7" />
      </svg>
    ),
  },
  {
    badge: "⚡ Post in under 2 minutes",
    headline: "Sell Your Items Fast",
    cta: { label: "Post a Free Ad →", href: "/sell" },
    ctaSecondary: { label: "Browse Listings", href: "/" },
    gradient: "from-brand via-[#1868DB] to-[#3C8CE7]",
    illustration: (
      <svg viewBox="0 0 260 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
        {/* Megaphone */}
        <path d="M80 70 L140 55 L140 125 L80 110 Z" fill="white" fillOpacity="0.25" />
        <rect x="60" y="70" width="22" height="40" rx="6" fill="white" fillOpacity="0.35" />
        <path d="M140 75 C165 68 185 75 185 90 C185 105 165 112 140 105" fill="white" fillOpacity="0.2" />
        {/* Sound waves */}
        <path d="M192 78 C204 82 210 87 210 90 C210 93 204 98 192 102" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.6" />
        <path d="M198 70 C218 76 228 83 228 90 C228 97 218 104 198 110" stroke="white" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.35" />
        {/* Sparkles */}
        <circle cx="40" cy="55" r="5" fill="white" fillOpacity="0.5" />
        <circle cx="220" cy="50" r="4" fill="white" fillOpacity="0.4" />
        <circle cx="210" cy="135" r="6" fill="white" fillOpacity="0.3" />
      </svg>
    ),
  },
  {
    badge: "🚗 Largest auto classifieds in Ghana",
    headline: "Drive Your Dream Car",
    cta: { label: "Browse Vehicles →", href: "/?category=vehicles" },
    gradient: "from-neutral-900 via-neutral-800 to-[#124F9E]",
    illustration: (
      <svg viewBox="0 0 260 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
        {/* Car body */}
        <rect x="35" y="100" width="190" height="45" rx="10" fill="white" fillOpacity="0.25" />
        <path d="M60 100 L85 68 L175 68 L200 100 Z" fill="white" fillOpacity="0.3" />
        {/* Windows */}
        <rect x="90" y="73" width="38" height="24" rx="4" fill="white" fillOpacity="0.5" />
        <rect x="132" y="73" width="38" height="24" rx="4" fill="white" fillOpacity="0.5" />
        {/* Wheels */}
        <circle cx="85" cy="148" r="20" fill="white" fillOpacity="0.15" />
        <circle cx="85" cy="148" r="13" fill="white" fillOpacity="0.25" />
        <circle cx="175" cy="148" r="20" fill="white" fillOpacity="0.15" />
        <circle cx="175" cy="148" r="13" fill="white" fillOpacity="0.25" />
        {/* Price tag */}
        <rect x="88" y="30" width="84" height="28" rx="8" fill="white" fillOpacity="0.95" />
        <text x="96" y="49" fontFamily="system-ui" fontSize="12" fontWeight="700" fill="#1868DB">GH₵ 45,000</text>
        {/* Stars */}
        <circle cx="30" cy="90" r="5" fill="white" fillOpacity="0.4" />
        <circle cx="230" cy="75" r="6" fill="white" fillOpacity="0.35" />
      </svg>
    ),
  },
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
          {/* Contrast scrim behind the text column so headline/CTA stay
              legible regardless of how bright the gradient is at that spot. */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-full bg-gradient-to-r from-black/35 via-black/10 to-transparent sm:w-2/3" />

          {/* Bottom padding here is deliberately generous -- it's not empty
              space, it's the room the absolutely-positioned search bar below
              needs so it can overlap the tail end of this gradient instead of
              living in its own separate strip underneath. */}
          <div className="relative mx-auto flex max-w-7xl items-center gap-4 px-4 pt-4 pb-20 sm:px-6 sm:pt-5 sm:pb-24 lg:pt-6 lg:pb-24">
            {/* Text content */}
            <div className="min-w-0 flex-1">
              <div className="mb-2 inline-flex items-center rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold text-white ring-1 ring-white/25 backdrop-blur-sm">
                {slide.badge}
              </div>
              <h1 className="text-lg font-extrabold leading-tight text-white sm:text-xl lg:text-2xl xl:text-3xl">
                {slide.headline}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Link
                  href={slide.cta.href}
                  className="rounded-full bg-white px-4 py-1.5 text-xs font-bold text-brand shadow-md transition hover:bg-brand-light hover:shadow-lg sm:text-sm"
                >
                  {slide.cta.label}
                </Link>
                {slide.ctaSecondary && (
                  <Link
                    href={slide.ctaSecondary.href}
                    className="rounded-full border border-white/40 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 sm:text-sm"
                  >
                    {slide.ctaSecondary.label}
                  </Link>
                )}
              </div>
              {/* Dot nav */}
              <div className="mt-3 flex items-center gap-1.5">
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

            {/* Illustration */}
            <div className="hidden w-36 shrink-0 sm:block lg:w-48 xl:w-56" aria-hidden>
              {slide.illustration}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Centered search bar overlapping the tail end of the gradient --
          intentionally a sibling of AnimatePresence, not inside the
          per-slide motion.div, so it never unmounts (and never loses
          in-progress focus/typing) as slides rotate underneath it. */}
      <div className="absolute inset-x-0 bottom-3 z-20 px-4 sm:bottom-4 sm:px-6 lg:bottom-5">
        <div className="mx-auto w-full max-w-2xl">
          <SearchBar />
        </div>
      </div>
    </div>
  );
}
