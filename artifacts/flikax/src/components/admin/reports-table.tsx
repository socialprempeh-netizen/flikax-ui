"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Flag, TriangleAlert } from "lucide-react";
import { ADMIN_REPORT_STATUS_LABELS, ADMIN_REPORT_STATUS_STYLES } from "@/lib/admin/reports";
import { REPORT_REASON_LABELS, type ReportReason } from "@/lib/report-reasons";
import {
  updateReportStatusAction,
  toggleReportPriorityAction,
  warnSellerForReportAction,
  suspendSellerForReportAction,
  deleteListingForReportAction,
} from "@/app/admin/reports/actions";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { withAuthRetry } from "@/lib/auth-retry";

export type AdminReportRow = {
  id: string;
  reason: string;
  status: string;
  priority: boolean;
  createdAt: string;
  reporterName: string | null;
  listingId: string;
  listingTitle: string;
  listingStatus: string;
  sellerId: string;
  sellerName: string | null;
};

type PendingConfirm =
  | { type: "suspend"; report: AdminReportRow }
  | { type: "delete"; report: AdminReportRow };

export function ReportsTable({ reports }: { reports: AdminReportRow[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<PendingConfirm | null>(null);
  const [warnTarget, setWarnTarget] = useState<AdminReportRow | null>(null);
  const [warnMessage, setWarnMessage] = useState("");
  const [suspendDays, setSuspendDays] = useState(7);

  const allSelected = reports.length > 0 && selected.size === reports.length;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(reports.map((r) => r.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function run(action: () => Promise<void>, onDone?: () => void) {
    setError(null);
    startTransition(async () => {
      try {
        await withAuthRetry(action);
        onDone?.();
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Action failed.");
      }
    });
  }

  const selectedIds = Array.from(selected);

  if (reports.length === 0) {
    return (
      <div className="border border-dashed border-slate-300 bg-white py-16 text-center text-sm text-slate-400">
        No reports match these filters.
      </div>
    );
  }

  return (
    <div>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {selectedIds.length > 0 && (
        <div className="sticky top-14 z-20 mb-3 flex flex-wrap items-center gap-2 border border-brand/30 bg-brand-light px-4 py-3">
          <span className="text-sm font-bold text-slate-800">{selectedIds.length} selected</span>
          <Button
            type="button"
            size="sm"
            disabled={isPending}
            onClick={() => run(() => updateReportStatusAction(selectedIds, "resolved"), () => setSelected(new Set()))}
            className="bg-green-600 hover:bg-green-700"
          >
            Resolve
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={isPending}
            onClick={() => run(() => updateReportStatusAction(selectedIds, "dismissed"), () => setSelected(new Set()))}
            className="bg-slate-600 hover:bg-slate-700"
          >
            Dismiss
          </Button>
        </div>
      )}

      <Card className="gap-0 divide-y divide-slate-300 overflow-hidden p-0 shadow-sm">
        <div className="flex items-center gap-3 bg-slate-50 px-4 py-2">
          <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Select all" />
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Select all on this page
          </span>
        </div>

        {reports.map((report) => (
          <div key={report.id} className="flex items-start gap-3 p-4 hover:bg-slate-50">
            <Checkbox
              checked={selected.has(report.id)}
              onCheckedChange={() => toggleOne(report.id)}
              aria-label={`Select report on ${report.listingTitle}`}
              className="mt-1 shrink-0"
            />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/admin/listings/${report.listingId}`}
                  className="truncate text-sm font-bold text-slate-800 hover:text-brand-dark hover:underline"
                >
                  {report.listingTitle}
                </Link>
                <Badge className={`shrink-0 ${ADMIN_REPORT_STATUS_STYLES[report.status] ?? "bg-slate-100 text-slate-600"}`}>
                  {ADMIN_REPORT_STATUS_LABELS[report.status] ?? report.status}
                </Badge>
                {report.priority && (
                  <Badge className="shrink-0 gap-1 bg-red-100 text-red-700">
                    <TriangleAlert className="size-3" />
                    High priority
                  </Badge>
                )}
              </div>
              <p className="mt-0.5 text-sm text-slate-500">
                {REPORT_REASON_LABELS[report.reason as ReportReason] ?? report.reason} · Reported by{" "}
                {report.reporterName ?? "Unknown"} · Seller:{" "}
                <Link href={`/admin/users/${report.sellerId}`} className="hover:text-brand-dark hover:underline">
                  {report.sellerName ?? "Unknown"}
                </Link>{" "}
                · {new Date(report.createdAt).toLocaleDateString()}
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
              {report.status !== "resolved" && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => run(() => updateReportStatusAction([report.id], "resolved"))}
                  className="border-green-200 text-green-700 hover:bg-green-50 hover:text-green-700"
                >
                  Resolve
                </Button>
              )}
              {report.status !== "dismissed" && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => run(() => updateReportStatusAction([report.id], "dismissed"))}
                >
                  Dismiss
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => run(() => toggleReportPriorityAction(report.id, !report.priority))}
                className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-700"
              >
                {report.priority ? "De-escalate" : "Escalate"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => {
                  setWarnTarget(report);
                  setWarnMessage("");
                }}
                className="border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-700"
              >
                Warn seller
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => setConfirm({ type: "suspend", report })}
                className="border-orange-200 text-orange-700 hover:bg-orange-50 hover:text-orange-700"
              >
                Suspend seller
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={isPending}
                onClick={() => setConfirm({ type: "delete", report })}
              >
                Delete listing
              </Button>
            </div>
          </div>
        ))}
      </Card>

      <ConfirmDialog
        open={confirm?.type === "delete"}
        title="Delete this listing?"
        message="This permanently deletes the listing and its photos, and marks the report resolved. This can't be undone."
        confirmLabel="Delete"
        pending={isPending}
        onConfirm={() =>
          confirm?.type === "delete" &&
          run(
            () => deleteListingForReportAction(confirm.report.id, confirm.report.listingId),
            () => setConfirm(null)
          )
        }
        onCancel={() => setConfirm(null)}
      />

      <Dialog open={confirm?.type === "suspend"} onOpenChange={(next) => !next && setConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend this seller?</DialogTitle>
            <DialogDescription>
              Blocks new listings and plan purchases for the chosen duration, and marks the report resolved.
            </DialogDescription>
          </DialogHeader>
          <select
            value={suspendDays}
            onChange={(e) => setSuspendDays(Number(e.target.value))}
            className="h-9 border border-input bg-transparent px-3 text-sm text-slate-800 shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {[3, 7, 14, 30].map((d) => (
              <option key={d} value={d}>
                {d} days
              </option>
            ))}
          </select>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirm(null)} disabled={isPending}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isPending}
              onClick={() =>
                confirm?.type === "suspend" &&
                run(
                  () => suspendSellerForReportAction(confirm.report.id, confirm.report.sellerId, suspendDays),
                  () => setConfirm(null)
                )
              }
            >
              {isPending ? "Working..." : "Suspend"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={warnTarget !== null} onOpenChange={(next) => !next && setWarnTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <Flag className="size-5" />
            </span>
            <DialogTitle>Warn {warnTarget?.sellerName ?? "seller"}</DialogTitle>
            <DialogDescription>
              Recorded on their profile — not delivered to them (no notification system exists yet).
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={3}
            value={warnMessage}
            onChange={(e) => setWarnMessage(e.target.value)}
            placeholder={`Regarding the report on "${warnTarget?.listingTitle}"...`}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setWarnTarget(null)} disabled={isPending}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isPending || !warnMessage.trim()}
              onClick={() =>
                warnTarget &&
                run(
                  () => warnSellerForReportAction(warnTarget.id, warnTarget.sellerId, warnMessage),
                  () => setWarnTarget(null)
                )
              }
            >
              {isPending ? "Working..." : "Log warning"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
