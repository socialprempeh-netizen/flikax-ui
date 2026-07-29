import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { buildAdminReportsHref, type AdminReportFilters } from "@/lib/admin-report-filters";
import { ReportsFilterBar } from "@/components/admin/reports-filter-bar";
import { ReportsTable, type AdminReportRow } from "@/components/admin/reports-table";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 20;

type PageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    reason?: string;
    page?: string;
  }>;
};

export default async function AdminReportsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const filters: AdminReportFilters = {
    q: params.q || undefined,
    status: params.status || undefined,
    reason: params.reason || undefined,
    page: params.page || undefined,
  };

  const supabase = await createClient();

  let query = supabase
    .from("reports")
    .select(
      "id, reason, status, priority, created_at, reporter:profiles!reports_reporter_id_fkey(full_name), listings!reports_listing_id_fkey(id, title, status, user_id, profiles(full_name))",
      { count: "exact" }
    );

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.reason) query = query.eq("reason", filters.reason);

  if (filters.q) {
    const searchTerm = `%${filters.q}%`;
    const [{ data: titleMatches }, { data: profileMatches }] = await Promise.all([
      supabase.from("listings").select("id").ilike("title", searchTerm),
      supabase.from("profiles").select("id").ilike("full_name", searchTerm),
    ]);
    const profileIds = (profileMatches ?? []).map((p) => p.id);
    let sellerListingIds: string[] = [];
    if (profileIds.length > 0) {
      const { data: sellerListings } = await supabase.from("listings").select("id").in("user_id", profileIds);
      sellerListingIds = (sellerListings ?? []).map((l) => l.id);
    }
    const matchedListingIds = Array.from(
      new Set([...(titleMatches ?? []).map((l) => l.id), ...sellerListingIds])
    );
    query =
      matchedListingIds.length > 0
        ? query.in("listing_id", matchedListingIds)
        : query.eq("listing_id", "00000000-0000-0000-0000-000000000000");
  }

  query = query.order("priority", { ascending: false }).order("created_at", { ascending: false });

  const page = Math.max(1, Number(filters.page) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  query = query.range(from, to);

  const { data: reportRows, count } = await query;

  const reports: AdminReportRow[] = (reportRows ?? [])
    .filter((row) => row.listings)
    .map((row) => ({
      id: row.id,
      reason: row.reason ?? "",
      status: row.status,
      priority: row.priority,
      createdAt: row.created_at,
      reporterName: row.reporter?.full_name ?? null,
      listingId: row.listings!.id,
      listingTitle: row.listings!.title,
      listingStatus: row.listings!.status,
      sellerId: row.listings!.user_id,
      sellerName: row.listings!.profiles?.full_name ?? null,
    }));

  const totalCount = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-800">Reports &amp; Abuse Center</h1>
      <p className="mt-1 text-sm text-slate-500">
        {totalCount} report{totalCount === 1 ? "" : "s"} total.
      </p>

      <div className="mt-6">
        <ReportsFilterBar filters={filters} />
        <ReportsTable reports={reports} />

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <Button asChild variant="outline" size="sm" disabled={page <= 1} className={page <= 1 ? "pointer-events-none opacity-50" : ""}>
              <Link href={buildAdminReportsHref({ ...filters, page: String(Math.max(1, page - 1)) })} aria-disabled={page <= 1}>
                <ChevronLeft className="size-4" />
                Previous
              </Link>
            </Button>
            <span className="text-sm text-slate-500">
              Page {page} of {totalPages}
            </span>
            <Button
              asChild
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
            >
              <Link
                href={buildAdminReportsHref({ ...filters, page: String(Math.min(totalPages, page + 1)) })}
                aria-disabled={page >= totalPages}
              >
                Next
                <ChevronRight className="size-4" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
