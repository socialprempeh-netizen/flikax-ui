import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

const SITE_URL = getSiteUrl();

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/admin/", "/api", "/auth", "/settings", "/dashboard", "/sell", "/messages"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
