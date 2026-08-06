import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";

// Top-level categories that should always lead the row/menu, in this exact
// order, regardless of their display_order in the database -- these are the
// highest-traffic categories and pinning them avoids relying on admins to
// keep display_order in sync with that priority.
const PRIORITY_PARENT_SLUGS = ["vehicles", "phones-tablets", "property", "electronics", "fashion"];

type CategoryRow = { id: string; name: string; slug: string; parent_id: string | null; icon: string | null };

// Moves the priority top-level categories to the front (in PRIORITY_PARENT_SLUGS
// order) and leaves every other row -- other parents, and all children --
// in its existing relative order. Array.sort is stable, so this is a pure
// reordering of the priority parents rather than a full re-sort.
function withPriorityParentsFirst(rows: CategoryRow[]): CategoryRow[] {
  const priorityRank = new Map(PRIORITY_PARENT_SLUGS.map((slug, i) => [slug, i]));
  return [...rows].sort((a, b) => {
    const rankA = a.parent_id === null ? priorityRank.get(a.slug) : undefined;
    const rankB = b.parent_id === null ? priorityRank.get(b.slug) : undefined;
    if (rankA !== undefined && rankB !== undefined) return rankA - rankB;
    if (rankA !== undefined) return -1;
    if (rankB !== undefined) return 1;
    return 0;
  });
}

// Full category list (id/name/slug/parent/icon) used for the homepage's
// category pills row and mega-menu. Rarely changes, so it's wrapped in
// unstable_cache rather than re-queried per request.
export const getCategories = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("categories")
      .select("id, name, slug, parent_id, icon")
      .order("display_order")
      .order("name");
    return withPriorityParentsFirst(data ?? []);
  },
  ["all-categories"],
  { revalidate: 300, tags: ["categories"] }
);
