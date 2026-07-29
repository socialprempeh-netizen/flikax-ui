"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ADMIN_MODERATION_FLAG_TYPE_LABELS,
  ADMIN_MODERATION_STATUS_LABELS,
  ADMIN_MODERATION_STATUS_STYLES,
} from "@/lib/admin-moderation";
import { updateModerationFlagStatusAction } from "@/app/admin/moderation/actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { withAuthRetry } from "@/lib/auth-retry";

export type AdminModerationRow = {
  id: string;
  flagType: string;
  detail: string | null;
  status: string;
  createdAt: string;
  listingId: string;
  listingTitle: string;
  sellerName: string | null;
  duplicateOfListingId: string | null;
  duplicateOfListingTitle: string | null;
};

export function ModerationTable({ flags }: { flags: AdminModerationRow[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const allSelected = flags.length > 0 && selected.size === flags.length;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(flags.map((f) => f.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function run(ids: string[], status: string) {
    setError(null);
    startTransition(async () => {
      try {
        await withAuthRetry(() => updateModerationFlagStatusAction(ids, status));
        setSelected(new Set());
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Action failed.");
      }
    });
  }

  const selectedIds = Array.from(selected);

  if (flags.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center text-sm text-slate-400">
        No flagged listings match these filters.
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
            onClick={() => run(selectedIds, "approved")}
            className="bg-green-600 hover:bg-green-700"
          >
            Approve
          </Button>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            disabled={isPending}
            onClick={() => run(selectedIds, "rejected")}
          >
            Reject &amp; hide listing
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => run(selectedIds, "escalated")}
            className="border-purple-200 text-purple-700 hover:bg-purple-50 hover:text-purple-700"
          >
            Escalate
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

        {flags.map((flag) => (
          <div key={flag.id} className="flex items-start gap-3 p-4 hover:bg-slate-50">
            <Checkbox
              checked={selected.has(flag.id)}
              onCheckedChange={() => toggleOne(flag.id)}
              aria-label={`Select flag on ${flag.listingTitle}`}
              className="mt-1 shrink-0"
            />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/admin/listings/${flag.listingId}`}
                  className="truncate text-sm font-bold text-slate-800 hover:text-brand hover:underline"
                >
                  {flag.listingTitle}
                </Link>
                <Badge className="shrink-0 bg-slate-100 text-slate-600">
                  {ADMIN_MODERATION_FLAG_TYPE_LABELS[flag.flagType] ?? flag.flagType}
                </Badge>
                <Badge className={`shrink-0 ${ADMIN_MODERATION_STATUS_STYLES[flag.status] ?? "bg-slate-100 text-slate-600"}`}>
                  {ADMIN_MODERATION_STATUS_LABELS[flag.status] ?? flag.status}
                </Badge>
              </div>
              <p className="mt-0.5 text-sm text-slate-500">
                Seller: {flag.sellerName ?? "Unknown"} · {new Date(flag.createdAt).toLocaleDateString()}
              </p>
              {flag.flagType === "duplicate_image" && flag.duplicateOfListingId && (
                <p className="mt-0.5 text-sm text-slate-500">
                  Matches:{" "}
                  <Link
                    href={`/admin/listings/${flag.duplicateOfListingId}`}
                    className="text-brand hover:underline"
                  >
                    {flag.duplicateOfListingTitle ?? flag.duplicateOfListingId}
                  </Link>
                </p>
              )}
              {flag.flagType === "contact_in_description" && flag.detail && (
                <p className="mt-0.5 truncate text-sm text-slate-500">Matched: &quot;{flag.detail}&quot;</p>
              )}
            </div>

            <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
              {flag.status !== "approved" && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => run([flag.id], "approved")}
                  className="border-green-200 text-green-700 hover:bg-green-50 hover:text-green-700"
                >
                  Approve
                </Button>
              )}
              {flag.status !== "rejected" && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => run([flag.id], "rejected")}
                  className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-700"
                >
                  Reject
                </Button>
              )}
              {flag.status !== "escalated" && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => run([flag.id], "escalated")}
                  className="border-purple-200 text-purple-700 hover:bg-purple-50 hover:text-purple-700"
                >
                  Escalate
                </Button>
              )}
              <Button asChild variant="outline" size="sm">
                <Link href={`/admin/listings/${flag.listingId}`}>Edit listing</Link>
              </Button>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
