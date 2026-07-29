"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Flag, Smile, Meh, Frown, type LucideIcon } from "lucide-react";
import {
  ADMIN_FEEDBACK_REPORT_STATUS_LABELS,
  ADMIN_FEEDBACK_REPORT_STATUS_STYLES,
} from "@/lib/admin-reviews";
import { FEEDBACK_REPORT_REASON_LABELS, type FeedbackReportReason } from "@/lib/feedback-report-reasons";
import {
  updateFeedbackReportStatusAction,
  deleteFeedbackAction,
  warnFeedbackAuthorAction,
} from "@/app/admin/reviews/actions";
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

const SENTIMENT_ICON: Record<string, LucideIcon> = { positive: Smile, neutral: Meh, negative: Frown };

export type AdminReviewRow = {
  id: string;
  reason: string;
  status: string;
  createdAt: string;
  reporterName: string | null;
  feedbackId: string;
  sentiment: string;
  message: string;
  authorId: string;
  authorName: string | null;
  targetProfileId: string;
  targetProfileName: string | null;
};

type PendingConfirm = { type: "delete"; review: AdminReviewRow };

export function ReviewsTable({ reviews }: { reviews: AdminReviewRow[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<PendingConfirm | null>(null);
  const [warnTarget, setWarnTarget] = useState<AdminReviewRow | null>(null);
  const [warnMessage, setWarnMessage] = useState("");

  const allSelected = reviews.length > 0 && selected.size === reviews.length;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(reviews.map((r) => r.id)));
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

  if (reviews.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center text-sm text-slate-400">
        No reported feedback matches these filters.
      </div>
    );
  }

  return (
    <div>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {selectedIds.length > 0 && (
        <div className="sticky top-14 z-20 mb-3 flex flex-wrap items-center gap-2 rounded-2xl border border-brand/30 bg-brand-light px-4 py-3">
          <span className="text-sm font-bold text-slate-800">{selectedIds.length} selected</span>
          <Button
            type="button"
            size="sm"
            disabled={isPending}
            onClick={() => run(() => updateFeedbackReportStatusAction(selectedIds, "resolved"), () => setSelected(new Set()))}
            className="bg-green-600 hover:bg-green-700"
          >
            Resolve
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={isPending}
            onClick={() => run(() => updateFeedbackReportStatusAction(selectedIds, "dismissed"), () => setSelected(new Set()))}
            className="bg-slate-600 hover:bg-slate-700"
          >
            Dismiss
          </Button>
        </div>
      )}

      <Card className="gap-0 divide-y divide-slate-100 overflow-hidden rounded-2xl p-0 shadow-sm">
        <div className="flex items-center gap-3 bg-slate-50 px-4 py-2">
          <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Select all" />
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Select all on this page
          </span>
        </div>

        {reviews.map((review) => {
          const SentimentIcon = SENTIMENT_ICON[review.sentiment] ?? Meh;
          return (
            <div key={review.id} className="flex items-start gap-3 p-4 hover:bg-slate-50">
              <Checkbox
                checked={selected.has(review.id)}
                onCheckedChange={() => toggleOne(review.id)}
                aria-label={`Select report on feedback from ${review.authorName ?? "unknown"}`}
                className="mt-1 shrink-0"
              />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <SentimentIcon className="size-4 shrink-0 text-slate-400" />
                  <span className="text-sm font-bold text-slate-800">{review.authorName ?? "Unknown"}</span>
                  <span className="text-xs text-slate-400">on</span>
                  <Link
                    href={`/u/${review.targetProfileId}`}
                    className="text-sm text-slate-600 hover:text-brand hover:underline"
                  >
                    {review.targetProfileName ?? "Unknown profile"}
                  </Link>
                  <Badge className={`shrink-0 ${ADMIN_FEEDBACK_REPORT_STATUS_STYLES[review.status] ?? "bg-slate-100 text-slate-600"}`}>
                    {ADMIN_FEEDBACK_REPORT_STATUS_LABELS[review.status] ?? review.status}
                  </Badge>
                </div>
                <p className="mt-1 truncate text-sm text-slate-600">&quot;{review.message}&quot;</p>
                <p className="mt-0.5 text-sm text-slate-500">
                  {FEEDBACK_REPORT_REASON_LABELS[review.reason as FeedbackReportReason] ?? review.reason} ·
                  Reported by {review.reporterName ?? "Unknown"} ·{" "}
                  {new Date(review.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
                {review.status !== "resolved" && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isPending}
                    onClick={() => run(() => updateFeedbackReportStatusAction([review.id], "resolved"))}
                    className="border-green-200 text-green-700 hover:bg-green-50 hover:text-green-700"
                  >
                    Resolve
                  </Button>
                )}
                {review.status !== "dismissed" && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isPending}
                    onClick={() => run(() => updateFeedbackReportStatusAction([review.id], "dismissed"))}
                  >
                    Dismiss
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => {
                    setWarnTarget(review);
                    setWarnMessage("");
                  }}
                  className="border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-700"
                >
                  Warn author
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  disabled={isPending}
                  onClick={() => setConfirm({ type: "delete", review })}
                >
                  Delete feedback
                </Button>
              </div>
            </div>
          );
        })}
      </Card>

      <ConfirmDialog
        open={confirm?.type === "delete"}
        title="Delete this feedback?"
        message="Removes the feedback entry and any replies, and marks the report resolved. This can't be undone."
        confirmLabel="Delete"
        pending={isPending}
        onConfirm={() =>
          confirm?.type === "delete" &&
          run(
            () => deleteFeedbackAction(confirm.review.id, confirm.review.feedbackId),
            () => setConfirm(null)
          )
        }
        onCancel={() => setConfirm(null)}
      />

      <Dialog open={warnTarget !== null} onOpenChange={(next) => !next && setWarnTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <Flag className="size-5" />
            </span>
            <DialogTitle>Warn {warnTarget?.authorName ?? "author"}</DialogTitle>
            <DialogDescription>
              Recorded on their profile — not delivered to them (no notification system exists yet).
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={3}
            value={warnMessage}
            onChange={(e) => setWarnMessage(e.target.value)}
            placeholder="Regarding the feedback you left..."
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
                  () => warnFeedbackAuthorAction(warnTarget.id, warnTarget.authorId, warnMessage),
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
