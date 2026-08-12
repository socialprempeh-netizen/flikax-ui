import type { NextConfig } from "next";

// Guard URL parsing so Next.js can start even without the env var set yet
// (the user will add NEXT_PUBLIC_SUPABASE_URL via Replit Secrets).
function getSupabaseHostname(): string {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname;
  } catch {
    return "*.supabase.co";
  }
}

const nextConfig: NextConfig = {
  images: {
    // Next's built-in image optimizer was off (a Replit-era default from
    // this repo's initial commit) despite `sharp` already being a real
    // dependency and `qualities` already being configured -- both signals
    // this was meant to be on. With it off, every listing photo/hero image
    // was served at its raw uploaded resolution regardless of its actual
    // display size (a Lighthouse-measured example: a 960x959 source image
    // rendered at 350x467, ~137KB heavier than it needed to be) -- a real
    // contributor to the site's LCP failure. Vercel's deployment runs this
    // optimizer natively, no extra infra needed.
    qualities: [75, 82],
    remotePatterns: [
      {
        protocol: "https",
        hostname: getSupabaseHostname(),
        pathname: "/storage/v1/object/public/**",
      },
      { protocol: "https", hostname: "placehold.co" },
    ],
  },
  async rewrites() {
    return [
      { source: "/sitemap-:category.xml", destination: "/sitemap-category/:category" },
    ];
  },
  async headers() {
    if (process.env.NODE_ENV !== "development") return [];
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0" },
          { key: "Pragma", value: "no-cache" },
        ],
      },
    ];
  },
};

export default nextConfig;
