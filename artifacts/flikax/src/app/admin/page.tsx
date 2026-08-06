import Link from "next/link";
import {
  Users,
  ClipboardList,
  Clock3,
  Star,
  TrendingUp,
  CheckCircle2,
  UserPlus,
  PlusCircle,
  Flag,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { BUMP_BADGE_DISPLAY_HOURS } from "@/lib/premium-plans";
import { TrendChart, RankBarChart } from "@/components/admin/dashboard-charts";
import { bucketByDay } from "@/lib/admin/analytics";
import { Card } from "@/components/ui/card";

const DAYS = 30;

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const now = new Date();
  const nowIso = now.toISOString();
  const todayStartIso = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  ).toISOString();
  const bumpCutoffIso = new Date(now.getTime() - BUMP_BADGE_DISPLAY_HOURS * 3600 * 1000).toISOString();
  const growthSinceIso = new Date(now.getTime() - DAYS * 24 * 3600 * 1000).toISOString();

  const [
    totalUsers,
    activeListings,
    pendingListings,
    featuredListings,
    bumpedListings,
    soldListings,
    newUsersToday,
    newListingsToday,
    openReports,
    categoryCountsResult,
    categoriesResult,
    locationRowsResult,
    listingGrowthResult,
    userGrowthResult,
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("status", "active")
      .or(`expires_at.is.null,expires_at.gt.${nowIso}`),
    supabase.from("listings").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("is_featured", true)
      .or(`featured_until.is.null,featured_until.gt.${nowIso}`),
    supabase.from("listings").select("id", { count: "exact", head: true }).gt("bumped_at", bumpCutoffIso),
    supabase.from("listings").select("id", { count: "exact", head: true }).eq("status", "sold"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", todayStartIso),
    supabase.from("listings").select("id", { count: "exact", head: true }).gte("created_at", todayStartIso),
    supabase.from("reports").select("id", { count: "exact", head: true }).eq("status", "open"),
    supabase.rpc("category_counts"),
    supabase.from("categories").select("id, name"),
    supabase.from("listings").select("location").eq("status", "active"),
    supabase.from("listings").select("created_at").gte("created_at", growthSinceIso),
    supabase.from("profiles").select("created_at").gte("created_at", growthSinceIso),
  ]);

  const categoryNames = new Map((categoriesResult.data ?? []).map((c) => [c.id, c.name]));
  const topCategories = [...(categoryCountsResult.data ?? [])]
    .sort((a, b) => b.listing_count - a.listing_count)
    .slice(0, 5)
    .map((row) => ({
      name: categoryNames.get(row.category_id) ?? "Unknown",
      count: row.listing_count,
    }));

  const locationCounts: Record<string, number> = {};
  for (const row of locationRowsResult.data ?? []) {
    locationCounts[row.location] = (locationCounts[row.location] ?? 0) + 1;
  }
  const topLocations = Object.entries(locationCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  const listingGrowth = bucketByDay(listingGrowthResult.data ?? [], DAYS);
  const userGrowth = bucketByDay(userGrowthResult.data ?? [], DAYS);

  const stats = [
    { label: "Total users", value: totalUsers.count ?? 0, icon: Users },
    { label: "Active listings", value: activeListings.count ?? 0, icon: ClipboardList },
    { label: "Pending listings", value: pendingListings.count ?? 0, icon: Clock3 },
    { label: "Featured listings", value: featuredListings.count ?? 0, icon: Star },
    { label: "Bumped listings", value: bumpedListings.count ?? 0, icon: TrendingUp },
    { label: "Sold listings", value: soldListings.count ?? 0, icon: CheckCircle2 },
    { label: "New users today", value: newUsersToday.count ?? 0, icon: UserPlus },
    { label: "New listings today", value: newListingsToday.count ?? 0, icon: PlusCircle },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-800">Dashboard</h1>
      <p className="mt-1 text-sm text-slate-500">Live overview of Flikax activity.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="gap-2 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{stat.label}</span>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-light text-brand">
                <stat.icon className="size-4" />
              </span>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{stat.value}</p>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link href="/admin/listings?status=pending">
          <Card className="flex-row items-center justify-between gap-3 rounded-2xl p-5 shadow-sm transition-colors hover:border-brand/40 hover:bg-brand-light/20">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                <Clock3 className="size-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-slate-800">Pending ads awaiting approval</p>
                <p className="text-xs text-slate-500">Review and approve or reject</p>
              </div>
            </div>
            <span className="text-2xl font-extrabold text-slate-800">{pendingListings.count ?? 0}</span>
          </Card>
        </Link>

        <Link href="/admin/reports">
          <Card className="flex-row items-center justify-between gap-3 rounded-2xl p-5 shadow-sm transition-colors hover:border-brand/40 hover:bg-brand-light/20">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-red-100 text-red-600">
                <Flag className="size-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-slate-800">Open reports</p>
                <p className="text-xs text-slate-500">Flagged listings to review</p>
              </div>
            </div>
            <span className="text-2xl font-extrabold text-slate-800">{openReports.count ?? 0}</span>
          </Card>
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <TrendChart data={listingGrowth} color="blue" />
        <TrendChart data={userGrowth} color="aqua" />
        <RankBarChart title="Top 5 categories" data={topCategories} />
        <RankBarChart title="Top 5 locations" data={topLocations} />
      </div>
    </div>
  );
}
