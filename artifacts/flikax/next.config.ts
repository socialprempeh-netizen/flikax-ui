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
