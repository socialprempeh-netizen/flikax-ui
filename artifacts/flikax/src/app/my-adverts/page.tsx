import { redirect } from "next/navigation";

type PageProps = {
  searchParams: Promise<{ tab?: string; category?: string }>;
};

// The bare /my-adverts list page moved to /dashboard -- this is a redirect
// shim kept alive so old links/bookmarks still work, forwarding along any
// tab/category query params the old page used. /my-adverts/[id]/edit (the
// only other route left under this path) is still real and unaffected.
export default async function MyAdvertsRedirectPage({ searchParams }: PageProps) {
  const { tab, category } = await searchParams;
  const params = new URLSearchParams();
  if (tab) params.set("tab", tab);
  if (category) params.set("category", category);
  const query = params.toString();
  redirect(query ? `/dashboard?${query}` : "/dashboard");
}
