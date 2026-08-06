import Link from "next/link";
import { X } from "lucide-react";
import { ADMIN_PURCHASE_STATUS_LABELS, ADMIN_PLAN_TYPE_LABELS } from "@/lib/admin/payments";
import type { AdminPaymentFilters } from "@/lib/admin/payments-filters";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SELECT_CLASS =
  "h-9 rounded-md border border-input bg-transparent px-3 text-sm text-slate-800 shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

export function PaymentsFilterBar({ filters }: { filters: AdminPaymentFilters }) {
  const hasFilters = Boolean(
    filters.q || filters.status || filters.planType || filters.dateFrom || filters.dateTo
  );

  return (
    <Card className="mb-4 gap-0 rounded-2xl p-4 shadow-sm">
      <form method="get" className="flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Search
          </span>
          <Input type="text" name="q" defaultValue={filters.q} placeholder="User name" className="w-52" />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Status
          </span>
          <select name="status" defaultValue={filters.status ?? ""} className={SELECT_CLASS}>
            <option value="">All</option>
            {Object.entries(ADMIN_PURCHASE_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Plan type
          </span>
          <select name="planType" defaultValue={filters.planType ?? ""} className={SELECT_CLASS}>
            <option value="">All</option>
            {Object.entries(ADMIN_PLAN_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            From
          </span>
          <Input type="date" name="dateFrom" defaultValue={filters.dateFrom} />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            To
          </span>
          <Input type="date" name="dateTo" defaultValue={filters.dateTo} />
        </label>

        <Button type="submit">Apply</Button>

        {hasFilters && (
          <Button asChild variant="ghost" className="text-slate-500 hover:text-brand">
            <Link href="/admin/payments">
              <X className="size-3.5" />
              Clear
            </Link>
          </Button>
        )}
      </form>
    </Card>
  );
}
