// Single source of truth for the site's absolute origin, used everywhere
// metadataBase/canonical URLs/Open Graph/JSON-LD need a full URL rather than
// a relative path. Previously duplicated as `const SITE_URL = ... ??
// "http://localhost:3000"` in 8 separate files, all with the same silent
// failure mode: if NEXT_PUBLIC_SITE_URL was never set in the deployment
// environment, every one of those files fell back to localhost -- which is
// exactly what happened in production (canonical links, OG tags, and
// JSON-LD were all resolving to http://localhost:3000 on the live site).
//
// Fallback order:
//   1. NEXT_PUBLIC_SITE_URL -- explicit override, e.g. once a custom domain
//      (flikax.com) is attached and should be the canonical one instead of
//      the Vercel-assigned domain.
//   2. VERCEL_PROJECT_PRODUCTION_URL -- a Vercel System Environment
//      Variable set automatically on every deployment, always pointing at
//      the project's current production domain. No dashboard configuration
//      required, and it self-updates if the production domain ever
//      changes. Server-only (no NEXT_PUBLIC_ prefix) but that's fine here:
//      every caller of getSiteUrl() runs server-side (metadata objects,
//      JSON-LD, sitemaps, robots.txt).
//   3. http://localhost:3000 -- local dev only.
export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}
