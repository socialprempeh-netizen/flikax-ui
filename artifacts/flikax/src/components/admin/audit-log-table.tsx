import { ADMIN_AUDIT_ACTION_LABELS } from "@/lib/admin-audit-labels";
import { ADMIN_AUDIT_TARGET_TYPE_LABELS } from "@/lib/admin-audit-logs-filters";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export type AdminAuditLogRow = {
  id: string;
  action: string;
  targetType: string;
  targetId: string | null;
  detail: Record<string, unknown> | null;
  createdAt: string;
  actorName: string | null;
};

export function AuditLogTable({ entries }: { entries: AdminAuditLogRow[] }) {
  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center text-sm text-slate-400">
        No audit log entries match these filters.
      </div>
    );
  }

  return (
    <Card className="gap-0 divide-y divide-slate-100 overflow-hidden rounded-2xl p-0 shadow-sm">
      {entries.map((entry) => (
        <div key={entry.id} className="flex items-start gap-3 p-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-slate-800">
                {ADMIN_AUDIT_ACTION_LABELS[entry.action] ?? entry.action}
              </span>
              <Badge className="bg-slate-100 text-slate-600">
                {ADMIN_AUDIT_TARGET_TYPE_LABELS[entry.targetType] ?? entry.targetType}
              </Badge>
            </div>
            <p className="mt-0.5 text-sm text-slate-500">
              By {entry.actorName ?? "Unknown"} · {new Date(entry.createdAt).toLocaleString()}
            </p>
            {entry.targetId && <p className="mt-0.5 text-xs text-slate-400">Target: {entry.targetId}</p>}
            {entry.detail && Object.keys(entry.detail).length > 0 && (
              <p className="mt-0.5 truncate text-xs text-slate-400">{JSON.stringify(entry.detail)}</p>
            )}
          </div>
        </div>
      ))}
    </Card>
  );
}
