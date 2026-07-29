import Link from "next/link";
import { ChevronLeft, ChevronRight, Banknote, CalendarDays, CalendarClock } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildAdminPaymentsHref, type AdminPaymentFilters } from "@/lib/admin-payments-filters";
import {
  ADMIN_PLAN_TYPE_LABELS,
  purchaseDisplayStatus,
  isStuckPending,
} from "@/lib/admin-payments";
import { PaymentsFilterBar } from "@/components/admin/payments-filter-bar";
import { PaymentsTable, type AdminPurchaseRow } from "@/components/admin/payments-table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PAGE_SIZE = 20;

type PageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    planType?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: string;
  }>;
};

export default async function AdminPaymentsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const filters: AdminPaymentFilters = {
    q: params.q || undefined,
    status: params.status || undefined,
    planType: params.planType || undefined,
    dateFrom: params.dateFrom || undefined,
    dateTo: params.dateTo || undefined,
    page: params.page || undefined,
  };

  const adminClient = createAdminClient();
  if (!adminClient) {
    return (
      <div>
        <h1 className="text-xl font-bold text-slate-800">Payments</h1>
        <p className="mt-4 text-sm text-red-600">
          Admin operations aren&apos;t configured on this environment (missing service role key).
        </p>
      </div>
    );
  }

  // purchases/payments have no RLS policy readable by a plain "admin" (only
  // super_admin, and payments has none at all) — this page reads exclusively
  // through the service-role client, same as /admin/users.
  const nowIso = new Date().toISOString();

  let query = adminClient
    .from("purchases")
    .select(
      "id, status, starts_at, expires_at, created_at, user_id, listing_id, plan_id, payment_id, profiles(full_name), premium_plans!inner(name, plan_type), payments(provider, reference, amount, currency, status, created_at), listings(id, title)",
      { count: "exact" }
    );

  if (filters.status === "expired") {
    query = query.eq("status", "active").lt("expires_at", nowIso);
  } else if (filters.status) {
    query = query.eq("status", filters.status);
  }
  if (filters.planType) query = query.eq("premium_plans.plan_type", filters.planType);
  if (filters.dateFrom) query = query.gte("created_at", filters.dateFrom);
  if (filters.dateTo) query = query.lte("created_at", `${filters.dateTo}T23:59:59`);

  if (filters.q) {
    const { data: profileMatches } = await adminClient
      .from("profiles")
      .select("id")
      .ilike("full_name", `%${filters.q}%`);
    const matchedIds = (profileMatches ?? []).map((p) => p.id);
    query = matchedIds.length > 0 ? query.in("user_id", matchedIds) : query.eq("user_id", "00000000-0000-0000-0000-000000000000");
  }

  query = query.order("created_at", { ascending: false });

  const page = Math.max(1, Number(filters.page) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  query = query.range(from, to);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(startOfToday.getFullYear(), startOfToday.getMonth(), 1);

  const [{ data: purchaseRows, count }, { data: revenueRows }] = await Promise.all([
    query,
    adminClient
      .from("purchases")
      .select("premium_plans(plan_type), payments!inner(amount, status, created_at)")
      .eq("payments.status", "success"),
  ]);

  const purchases: AdminPurchaseRow[] = (purchaseRows ?? []).map((row) => ({
    id: row.id,
    displayStatus: purchaseDisplayStatus(row.status, row.expires_at),
    planName: row.premium_plans?.name ?? "Unknown plan",
    planType: row.premium_plans?.plan_type ?? "",
    amount: row.payments?.amount ?? null,
    currency: row.payments?.currency ?? null,
    provider: row.payments?.provider ?? null,
    reference: row.payments?.reference ?? null,
    paymentStatus: row.payments?.status ?? null,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    userName: row.profiles?.full_name ?? null,
    userId: row.user_id,
    listingId: row.listings?.id ?? null,
    listingTitle: row.listings?.title ?? null,
    stuck: row.payments ? isStuckPending(row.payments.status, row.payments.created_at) : false,
  }));

  let totalRevenue = 0;
  let monthRevenue = 0;
  let todayRevenue = 0;
  const byPlanType: Record<string, number> = {};
  for (const row of revenueRows ?? []) {
    const amount = row.payments?.amount ?? 0;
    const createdAt = row.payments?.created_at ? new Date(row.payments.created_at) : null;
    totalRevenue += amount;
    if (createdAt && createdAt >= startOfMonth) monthRevenue += amount;
    if (createdAt && createdAt >= startOfToday) todayRevenue += amount;
    const planType = row.premium_plans?.plan_type ?? "unknown";
    byPlanType[planType] = (byPlanType[planType] ?? 0) + amount;
  }

  const totalCount = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-800">Payments</h1>
      <p className="mt-1 text-sm text-slate-500">
        {totalCount} purchase{totalCount === 1 ? "" : "s"} total.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="gap-2 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total revenue</span>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-light text-brand">
              <Banknote className="size-4" />
            </span>
          </div>
          <p className="text-2xl font-extrabold text-slate-800">GHS {totalRevenue.toFixed(2)}</p>
        </Card>
        <Card className="gap-2 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">This month</span>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-light text-brand">
              <CalendarDays className="size-4" />
            </span>
          </div>
          <p className="text-2xl font-extrabold text-slate-800">GHS {monthRevenue.toFixed(2)}</p>
        </Card>
        <Card className="gap-2 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Today</span>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-light text-brand">
              <CalendarClock className="size-4" />
            </span>
          </div>
          <p className="text-2xl font-extrabold text-slate-800">GHS {todayRevenue.toFixed(2)}</p>
        </Card>
      </div>

      {Object.keys(byPlanType).length > 0 && (
        <Card className="mt-3 flex-row flex-wrap gap-2 rounded-2xl p-4 text-sm text-slate-600 shadow-sm">
          {Object.entries(byPlanType).map(([planType, amount]) => (
            <Badge key={planType} className="bg-slate-100 px-3 py-1 text-slate-600">
              {ADMIN_PLAN_TYPE_LABELS[planType] ?? planType}: GHS {amount.toFixed(2)}
            </Badge>
          ))}
        </Card>
      )}

      <div className="mt-6">
        <PaymentsFilterBar filters={filters} />
        <PaymentsTable purchases={purchases} />

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <Button asChild variant="outline" size="sm" disabled={page <= 1} className={page <= 1 ? "pointer-events-none opacity-50" : ""}>
              <Link href={buildAdminPaymentsHref({ ...filters, page: String(Math.max(1, page - 1)) })} aria-disabled={page <= 1}>
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
                href={buildAdminPaymentsHref({ ...filters, page: String(Math.min(totalPages, page + 1)) })}
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
