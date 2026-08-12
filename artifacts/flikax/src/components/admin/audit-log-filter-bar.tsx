import Link from "next/link";
import { X } from "lucide-react";
import { ADMIN_AUDIT_ACTION_LABELS } from "@/lib/admin/audit-labels";
import { ADMIN_AUDIT_TARGET_TYPE_LABELS, type AdminAuditLogFilters } from "@/lib/admin/audit-logs-filters";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SELECT_CLASS =
  "h-9 border border-input bg-transparent px-3 text-sm text-slate-800 shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

export function AuditLogFilterBar({ filters }: { filters: AdminAuditLogFilters }) {
  const hasFilters = Boolean(
    filters.q || filters.action || filters.targetType || filters.dateFrom || filters.dateTo
  );

  return (
    <Card className="mb-4 gap-0 p-4 shadow-sm">
      <form method="get" className="flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Search
          </span>
          <Input type="text" name="q" defaultValue={filters.q} placeholder="Admin name" className="w-52" />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Action
          </span>
          <select name="action" defaultValue={filters.action ?? ""} className={SELECT_CLASS}>
            <option value="">All</option>
            {Object.entries(ADMIN_AUDIT_ACTION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Target type
          </span>
          <select name="targetType" defaultValue={filters.targetType ?? ""} className={SELECT_CLASS}>
            <option value="">All</option>
            {Object.entries(ADMIN_AUDIT_TARGET_TYPE_LABELS).map(([value, label]) => (
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
          <Button asChild variant="ghost" className="text-slate-500 hover:text-brand-dark">
            <Link href="/admin/audit-logs">
              <X className="size-3.5" />
              Clear
            </Link>
          </Button>
        )}
      </form>
    </Card>
  );
}
