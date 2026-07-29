import Link from "next/link";
import { X } from "lucide-react";
import { ADMIN_FEEDBACK_REPORT_STATUS_LABELS } from "@/lib/admin-reviews";
import { FEEDBACK_REPORT_REASON_LABELS } from "@/lib/feedback-report-reasons";
import type { AdminReviewFilters } from "@/lib/admin-reviews-filters";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SELECT_CLASS =
  "h-9 rounded-md border border-input bg-transparent px-3 text-sm text-slate-800 shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

export function ReviewsFilterBar({ filters }: { filters: AdminReviewFilters }) {
  const hasFilters = Boolean(filters.q || filters.status || filters.reason);

  return (
    <Card className="mb-4 gap-0 rounded-2xl p-4 shadow-sm">
      <form method="get" className="flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Search
          </span>
          <Input type="text" name="q" defaultValue={filters.q} placeholder="Reporter or author name" className="w-56" />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Status
          </span>
          <select name="status" defaultValue={filters.status ?? ""} className={SELECT_CLASS}>
            <option value="">All</option>
            {Object.entries(ADMIN_FEEDBACK_REPORT_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Reason
          </span>
          <select name="reason" defaultValue={filters.reason ?? ""} className={SELECT_CLASS}>
            <option value="">All</option>
            {Object.entries(FEEDBACK_REPORT_REASON_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <Button type="submit">Apply</Button>

        {hasFilters && (
          <Button asChild variant="ghost" className="text-slate-500 hover:text-brand">
            <Link href="/admin/reviews">
              <X className="size-3.5" />
              Clear
            </Link>
          </Button>
        )}
      </form>
    </Card>
  );
}
