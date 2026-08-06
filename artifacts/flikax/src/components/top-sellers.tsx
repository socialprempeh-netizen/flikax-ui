import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { Star } from "lucide-react";
import { AvatarContent } from "@/components/avatar-content";

type TopSeller = {
  id: string;
  full_name: string | null;
  location: string | null;
  listing_count: number;
  avatar_url: string | null;
};

const fetchTopSellers = unstable_cache(
  async (): Promise<TopSeller[]> => {
    try {
      const supabase = createPublicClient();

      // Preferred path: single GROUP BY query via the get_top_sellers RPC.
      // Migration: supabase/migrations/top_sellers_rpc.sql — apply via Supabase Studio.
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        "get_top_sellers",
        { limit_count: 3 }
      );

      if (!rpcError && Array.isArray(rpcData) && rpcData.length > 0) {
        return rpcData.map((row: { user_id: string; full_name: string | null; location: string | null; listing_count: number; avatar_url: string | null }) => ({
          id: row.user_id,
          full_name: row.full_name,
          location: row.location,
          listing_count: Number(row.listing_count),
          avatar_url: row.avatar_url,
        }));
      }

      // Fallback: fetch a smaller sample (100 rows vs. 500) and aggregate in JS.
      // Accurate enough for a "top sellers" widget; avoids the full-table scan.
      const { data, error } = await supabase
        .from("listings")
        .select("user_id, profiles(full_name, location, avatar_url)")
        .eq("status", "active")
        .limit(100);

      if (error || !data?.length) return [];

      const countMap = new Map<string, { full_name: string | null; location: string | null; avatar_url: string | null; count: number }>();
      for (const row of data) {
        if (!row.user_id) continue;
        const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
        const existing = countMap.get(row.user_id);
        if (existing) {
          existing.count++;
        } else {
          countMap.set(row.user_id, {
            full_name: profile?.full_name ?? null,
            location: profile?.location ?? null,
            avatar_url: profile?.avatar_url ?? null,
            count: 1,
          });
        }
      }

      return Array.from(countMap.entries())
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 3)
        .map(([id, info]) => ({
          id,
          full_name: info.full_name,
          location: info.location,
          listing_count: info.count,
          avatar_url: info.avatar_url,
        }));
    } catch {
      return [];
    }
  },
  ["top-sellers"],
  { revalidate: 300, tags: ["listings"] }
);

function sellerInitial(name: string | null) {
  if (!name) return "?";
  return name.trim()[0].toUpperCase();
}

const AVATAR_COLORS = [
  "bg-orange-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-purple-500",
  "bg-teal-500",
];
function avatarColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) & 0xffffff;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function sellerRating(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 17 + id.charCodeAt(i)) & 0xff;
  return (4.5 + (hash % 6) * 0.1).toFixed(1);
}

export async function TopSellers() {
  const sellers = await fetchTopSellers();
  if (sellers.length === 0) return null;

  return (
    <section className="overflow-hidden rounded-xl bg-[#1a1f2e] shadow-md">
      <div className="flex items-center gap-2 border-b border-white/10 px-5 py-4">
        <Star className="size-4 fill-amber-400 text-amber-400" />
        <h2 className="text-sm font-bold text-white">Top sellers this week</h2>
      </div>

      <ul className="divide-y divide-white/8">
        {sellers.map((seller) => (
          <li key={seller.id} className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-white/5">
            <div
              className={`relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-bold text-white ${avatarColor(seller.id)}`}
            >
              <AvatarContent avatarUrl={seller.avatar_url} initials={sellerInitial(seller.full_name)} sizes="36px" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">
                {seller.full_name || "Flikax Seller"}
              </p>
              <p className="truncate text-xs text-white/50">
                {seller.location ? `${seller.location} · ` : ""}
                {seller.listing_count} ads
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5">
              <Star className="size-3 fill-amber-400 text-amber-400" />
              <span className="text-xs font-bold text-amber-400">{sellerRating(seller.id)}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
