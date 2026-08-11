import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildSitemapIndexXml, XML_HEADERS } from "@/lib/sitemap-xml";
import { getSiteUrl } from "@/lib/site-url";

export const revalidate = 3600;

const SITE_URL = getSiteUrl();

export async function GET() {
  const supabase = await createClient();
  const { data: topLevelCategories } = await supabase
    .from("categories")
    .select("slug")
    .is("parent_id", null)
    .order("display_order");

  const entries = [
    { loc: `${SITE_URL}/sitemap-pages.xml` },
    ...(topLevelCategories ?? []).map((c) => ({ loc: `${SITE_URL}/sitemap-${c.slug}.xml` })),
  ];

  return new NextResponse(buildSitemapIndexXml(entries), { headers: XML_HEADERS });
}
