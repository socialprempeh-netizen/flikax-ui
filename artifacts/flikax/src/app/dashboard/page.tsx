import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, ChevronDown } from "lucide-react";
import { createClient, getUser } from "@/lib/supabase/server";
import { resolveListingImageUrl } from "@/lib/images";
import { getListingPath } from "@/lib/listing-url";
import { PAYMENTS_ENABLED } from "@/lib/payments/config";
import { getEnabledPlans, LISTING_SCOPED_PLAN_TYPES } from "@/lib/premium-plans";
import { DashboardListingsList, type DashboardListingRow } from "@/components/dashboard/dashboard-listings-list";
import { Button } from "@/components/ui/button";

type Tab = "active" | "declined" | "closed";

type PageProps = {
  searchParams: Promise<{ tab?: string; category?: string }>;
};

export default async function DashboardPage({ searchParams }: PageProps) {
  const { tab: rawTab, category } = await searchParams;
  const tab: Tab = rawTab === "declined" || rawTab === "closed" ? rawTab : "active";

  const supabase = await createClient();
  const {
    data: { user },
  } = await getUser();

  if (!user) {
    redirect("/auth/login?redirect=/dashboard");
  }

  const [{ data: listings }, { data: categories }, allPlans, { data: profile }] = await Promise.all([
    supabase
      .from("listings")
      .select(
        "id, title, price, location, status, declined_reason, category_id, is_featured, featured_until, short_id, listing_images(storage_path, position), categories(slug)"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase.from("categories").select("id, name, slug, parent_id").order("name"),
    getEnabledPlans(),
    supabase.from("profiles").select("suspended_until").eq("id", user.id).maybeSingle(),
  ]);

  const isSuspended = Boolean(profile?.suspended_until && new Date(profile.suspended_until) > new Date());
  const listingScopedPlans = allPlans.filter((p) => LISTING_SCOPED_PLAN_TYPES.includes(p.plan_type));

  const all = listings ?? [];
  const categoryList = categories ?? [];
  const categoryById = new Map(categoryList.map((c) => [c.id, c]));
  const parentCategories = categoryList.filter((c) => c.parent_id === null);

  function matchesCategoryFilter(listing: (typeof all)[number]) {
    if (!category) return true;
    const cat = categoryById.get(listing.category_id);
    if (!cat) return false;
    if (cat.slug === category) return true;
    const parent = cat.parent_id ? categoryById.get(cat.parent_id) : undefined;
    return parent?.slug === category;
  }

  const grouped: Record<Tab, typeof all> = {
    active: all.filter((l) => l.status === "active"),
    declined: all.filter((l) => l.status === "declined"),
    closed: all.filter((l) => l.status === "sold" || l.status === "removed"),
  };

  const now = Date.now();
  const visibleListings: DashboardListingRow[] = grouped[tab].filter(matchesCategoryFilter).map((listing) => {
    const cover = [...(listing.listing_images ?? [])].sort((a, b) => a.position - b.position)[0];
    return {
      id: listing.id,
      href: getListingPath({
        title: listing.title,
        location: listing.location,
        short_id: listing.short_id,
        categorySlug: listing.categories?.slug ?? "listing",
      }),
      title: listing.title,
      price: listing.price,
      status: listing.status,
      declined_reason: listing.declined_reason,
      imageUrl: cover ? resolveListingImageUrl(supabase, cover.storage_path) : null,
      isFeatured: listing.is_featured && (listing.featured_until ? new Date(listing.featured_until).getTime() > now : false),
    };
  });

  const tabs: { key: Tab; label: string }[] = [
    { key: "active", label: "Active" },
    { key: "declined", label: "Declined" },
    { key: "closed", label: "Closed" },
  ];

  function tabHref(key: Tab) {
    const params = new URLSearchParams();
    params.set("tab", key);
    if (category) params.set("category", category);
    return `/dashboard?${params.toString()}`;
  }

  return (
    <section className="space-y-4">
      <h1 className="border-l-4 border-brand pl-3 text-xl font-bold text-neutral-800">
        My Listings
      </h1>

      {/* Suspended warning */}
      {isSuspended && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
          <p className="text-sm text-amber-700">
            Your account is suspended. You can&apos;t post new listings or buy boosts until{" "}
            <span className="font-semibold">{new Date(profile!.suspended_until!).toLocaleDateString()}</span>.
          </p>
        </div>
      )}

      {/* Tabs + category filter */}
      <div className="overflow-hidden rounded-xl border border-neutral-100 bg-white shadow-sm">
        <div className="flex border-b border-neutral-100">
          {tabs.map((t) => (
            <Link
              key={t.key}
              href={tabHref(t.key)}
              className={`flex-1 border-b-2 py-3 text-center text-sm font-semibold transition-colors ${
                tab === t.key
                  ? "border-brand bg-brand-light text-brand-dark"
                  : "border-transparent text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700"
              }`}
            >
              {t.label}
              <span
                className={`ml-1.5 inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-3xs font-bold leading-none ${
                  tab === t.key ? "bg-brand-dark text-white" : "bg-neutral-100 text-neutral-500"
                }`}
              >
                {grouped[t.key].length}
              </span>
            </Link>
          ))}
        </div>

        <form action="/dashboard" method="get" className="flex items-center gap-2 px-4 py-3">
          <input type="hidden" name="tab" value={tab} />
          <div className="relative flex-1 sm:flex-none">
            <select
              name="category"
              defaultValue={category ?? ""}
              className="w-full appearance-none rounded-lg border border-neutral-200 bg-white py-1.5 pl-3 pr-8 text-sm text-neutral-700 outline-none focus:border-brand"
            >
              <option value="">All categories</option>
              {parentCategories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
          </div>
          <Button type="submit" size="sm">
            Filter
          </Button>
        </form>
      </div>

      {/* Listings — DashboardListingsList renders its own card */}
      <DashboardListingsList
        listings={visibleListings}
        paymentsEnabled={PAYMENTS_ENABLED && !isSuspended}
        plans={listingScopedPlans}
      />
    </section>
  );
}
