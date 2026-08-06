import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { buildAdminSupportHref, type AdminSupportFilters } from "@/lib/admin/support-filters";
import { SupportFilterBar } from "@/components/admin/support-filter-bar";
import { SupportTable, type AdminTicketRow } from "@/components/admin/support-table";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 20;

type PageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    page?: string;
  }>;
};

export default async function AdminSupportPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const filters: AdminSupportFilters = {
    q: params.q || undefined,
    status: params.status || undefined,
    page: params.page || undefined,
  };

  const supabase = await createClient();

  let query = supabase.from("support_tickets").select("*", { count: "exact" });

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.q) {
    const searchTerm = `%${filters.q}%`;
    query = query.or(`name.ilike.${searchTerm},email.ilike.${searchTerm}`);
  }

  query = query.order("created_at", { ascending: false });

  const page = Math.max(1, Number(filters.page) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  query = query.range(from, to);

  const { data: ticketRows, count } = await query;

  const tickets: AdminTicketRow[] = (ticketRows ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    topic: row.topic,
    message: row.message,
    status: row.status,
    createdAt: row.created_at,
  }));

  const totalCount = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-800">Support Tickets</h1>
      <p className="mt-1 text-sm text-slate-500">
        {totalCount} ticket{totalCount === 1 ? "" : "s"} total.
      </p>

      <div className="mt-6">
        <SupportFilterBar filters={filters} />
        <SupportTable tickets={tickets} />

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <Button asChild variant="outline" size="sm" disabled={page <= 1} className={page <= 1 ? "pointer-events-none opacity-50" : ""}>
              <Link href={buildAdminSupportHref({ ...filters, page: String(Math.max(1, page - 1)) })} aria-disabled={page <= 1}>
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
                href={buildAdminSupportHref({ ...filters, page: String(Math.min(totalPages, page + 1)) })}
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
