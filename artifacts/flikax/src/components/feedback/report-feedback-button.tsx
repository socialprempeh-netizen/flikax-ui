"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Flag } from "lucide-react";
import { reportFeedbackAction } from "@/app/u/actions";
import {
  FEEDBACK_REPORT_REASONS,
  FEEDBACK_REPORT_REASON_LABELS,
  type FeedbackReportReason,
} from "@/lib/feedback-report-reasons";

export function ReportFeedbackButton({ feedbackId }: { feedbackId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<FeedbackReportReason | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  function close() {
    setOpen(false);
    setReason(null);
    setError(null);
  }

  function submit() {
    if (!reason) {
      setError("Choose a reason.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await reportFeedbackAction(feedbackId, reason);
      if (result.error) {
        setError(result.error);
        return;
      }
      setDone(true);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 flex items-center gap-1 text-xs font-medium text-neutral-400 hover:text-red-600"
      >
        <Flag className="size-3" />
        Report
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-neutral-900/70 p-4">
          <div className="w-full max-w-md bg-white p-5 shadow-xl">
            {done ? (
              <>
                <h2 className="text-base font-bold text-neutral-800">Report submitted</h2>
                <p className="mt-1 text-sm text-neutral-600">Thanks — our team will review this feedback.</p>
                <button
                  type="button"
                  onClick={close}
                  className="mt-5 w-full bg-brand-dark py-2.5 text-sm font-bold text-white hover:brightness-110"
                >
                  Close
                </button>
              </>
            ) : (
              <>
                <div className="flex items-start gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                    <Flag className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-base font-bold text-neutral-800">Report this feedback</h2>
                    <p className="mt-1 text-sm text-neutral-600">Let us know what&apos;s wrong with it.</p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {FEEDBACK_REPORT_REASONS.map((value) => (
                    <label
                      key={value}
                      className="flex items-center gap-2 border border-neutral-200 px-3 py-2 text-sm text-neutral-700 has-[:checked]:border-brand has-[:checked]:bg-brand-light"
                    >
                      <input
                        type="radio"
                        name="reason"
                        value={value}
                        checked={reason === value}
                        onChange={() => setReason(value)}
                        className="accent-brand"
                      />
                      {FEEDBACK_REPORT_REASON_LABELS[value]}
                    </label>
                  ))}
                </div>

                {error && <p className="mt-3 text-sm text-red-600" role="alert">{error}</p>}

                <div className="mt-5 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={close}
                    disabled={isPending}
                    className="border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={submit}
                    disabled={isPending}
                    className="bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
                  >
                    {isPending ? "Submitting..." : "Submit report"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
