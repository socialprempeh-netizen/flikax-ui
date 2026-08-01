"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { submitReportAction } from "@/app/listings/actions";
import { withAuthRetry } from "@/lib/auth-retry";
import { REPORT_REASONS, REPORT_REASON_LABELS, type ReportReason } from "@/lib/report-reasons";

export function ReportListingButton({ listingId }: { listingId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function close() {
    setOpen(false);
    setReason(null);
    setError(null);
  }

  async function submit() {
    if (!reason) {
      setError("Choose a reason.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await withAuthRetry(() => submitReportAction(listingId, reason));
      setSubmitting(false);
      setDone(true);
    } catch (err) {
      setSubmitting(false);
      setError(err instanceof Error ? err.message : "Could not submit report.");
    }
  }

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)} variant="outline" className="h-11 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-600">
        <AlertTriangle className="size-4" />
        Report Abuse
      </Button>

      <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
        <DialogContent>
          {done ? (
            <>
              <DialogHeader>
                <DialogTitle>Report submitted</DialogTitle>
                <DialogDescription>Thanks — our team will review this listing.</DialogDescription>
              </DialogHeader>
              <Button type="button" onClick={close} className="h-11 w-full">
                Close
              </Button>
            </>
          ) : (
            <>
              <DialogHeader>
                <div className="flex items-start gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                    <AlertTriangle className="size-5" />
                  </span>
                  <div className="min-w-0 text-left">
                    <DialogTitle>Report this listing</DialogTitle>
                    <DialogDescription>
                      Let us know what&apos;s wrong. We&apos;ll review it as soon as possible.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-2">
                {REPORT_REASONS.map((value) => (
                  <label
                    key={value}
                    className="flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 has-[:checked]:border-brand has-[:checked]:bg-brand-light"
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={value}
                      checked={reason === value}
                      onChange={() => setReason(value)}
                      className="accent-brand"
                    />
                    {REPORT_REASON_LABELS[value]}
                  </label>
                ))}
              </div>

              {error && <p className="text-sm text-red-600" role="alert">{error}</p>}

              <div className="flex justify-end gap-2">
                <Button type="button" onClick={close} disabled={submitting} variant="outline" className="h-11">
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={submit}
                  disabled={submitting}
                  className="h-11 bg-red-600 hover:bg-red-700"
                >
                  {submitting ? "Submitting..." : "Submit report"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
