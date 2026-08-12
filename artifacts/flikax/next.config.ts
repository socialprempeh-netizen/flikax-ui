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
    // REVERTED (see git history for the brief window this was enabled):
    // turning Next's built-in image optimizer on broke every image
    // sitewide in production -- not a remotePatterns/config problem (the
    // generated /_next/image URLs were correct, right hostname/path) but
    // Vercel's own image-optimization request quota: every request came
    // back `402 Payment Required` / `OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED`,
    // meaning the current Vercel plan doesn't cover the optimization volume
    // this triggered. `unoptimized: true` serves each image's raw uploaded
    // bytes directly from Supabase Storage again -- worse for LCP/payload
    // size (see the bulk-image-cache-fix and Lighthouse-audit work for that
    // tradeoff), but actually loads, which raw correctness beats. Don't
    // flip this back on without first confirming the Vercel plan/usage
    // supports it (Vercel dashboard -> Usage -> Image Optimization).
    unoptimized: true,
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
