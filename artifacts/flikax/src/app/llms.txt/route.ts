import { getSiteUrl } from "@/lib/site-url";

// llms.txt (https://llmstxt.org) -- a robots.txt-equivalent aimed at LLMs
// and AI agents/crawlers rather than search-engine crawlers: a short,
// markdown-formatted summary of what the site is and where its key public
// sections live, so an agent doesn't have to infer that by crawling.
// No Next.js metadata-route convention exists for this file type (unlike
// robots.ts/sitemap.ts), so it's a plain route handler returning text/plain.
export async function GET() {
  const siteUrl = getSiteUrl();

  const body = `# Flikax

> Flikax is a classifieds marketplace for Ghana -- buy and sell vehicles,
> property, phones & tablets, electronics, fashion, and more. Free to post,
> no fees.

## Key sections

- [Browse listings](${siteUrl}/): homepage, search, and category browsing
- [Post an ad](${siteUrl}/sell): create a free listing (requires sign-in)
- [About](${siteUrl}/about): who Flikax is
- [Trust & Safety](${siteUrl}/trust-safety): buyer/seller safety guidance
- [Terms of Service](${siteUrl}/terms)
- [Privacy Policy](${siteUrl}/privacy)

## Notes for agents

- Listing detail pages live at /{category}/{slug} (e.g. /cars/toyota-corolla-accra-1a2b3c).
- Category pages live at /{category} (e.g. /vehicles, /property, /phones-tablets).
- Seller storefronts live at /seller/{id}.
- Full sitemap: ${siteUrl}/sitemap.xml
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
