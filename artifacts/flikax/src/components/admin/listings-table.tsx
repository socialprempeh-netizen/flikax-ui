"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ImageOff, Star, TrendingUp, AlertTriangle } from "lucide-react";
import { ADMIN_STATUS_LABELS, ADMIN_STATUS_STYLES } from "@/lib/admin/listings";
import { updateListingStatusAction, deleteListingsAction } from "@/app/admin/listings/actions";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { withAuthRetry } from "@/lib/auth-retry";

const currency = new Intl.NumberFormat("en-GH", {
  style: "currency",
  currency: "GHS",
  maximumFractionDigits: 0,
});

export type AdminListingRow = {
  id: string;
  title: string;
  price: number;
  status: string;
  location: string;
  categoryName: string | null;
  sellerName: string | null;
  imageUrl: string | null;
  isFeatured: boolean;
  isBumped: boolean;
  isExpired: boolean;
};

type PendingConfirm =
  | { type: "reject" | "hide"; ids: string[] }
  | { type: "delete"; ids: string[] };

export function ListingsTable({ listings }: { listings: AdminListingRow[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<PendingConfirm | null>(null);

  const allSelected = listings.length > 0 && selected.size === listings.length;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(listings.map((l) => l.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function runStatusChange(ids: string[], status: string) {
    setError(null);
    startTransition(async () => {
      try {
        await withAuthRetry(() => updateListingStatusAction(ids, status));
        setSelected(new Set());
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Action failed.");
      }
    });
  }

  function runDelete(ids: string[]) {
    setError(null);
    startTransition(async () => {
      try {
        await withAuthRetry(() => deleteListingsAction(ids));
        setSelected(new Set());
        setConfirm(null);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Delete failed.");
      }
    });
  }

  function handleConfirm() {
    if (!confirm) return;
    if (confirm.type === "delete") {
      runDelete(confirm.ids);
    } else if (confirm.type === "reject") {
      runStatusChange(confirm.ids, "declined");
      setConfirm(null);
    } else if (confirm.type === "hide") {
      runStatusChange(confirm.ids, "removed");
      setConfirm(null);
    }
  }

  const selectedIds = Array.from(selected);

  if (listings.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center text-sm text-slate-400">
        No listings match these filters.
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
            onClick={() => runStatusChange(selectedIds, "active")}
            className="bg-green-600 hover:bg-green-700"
          >
            Approve
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={isPending}
            onClick={() => setConfirm({ type: "reject", ids: selectedIds })}
            className="bg-amber-600 hover:bg-amber-700"
          >
            Reject
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={isPending}
            onClick={() => setConfirm({ type: "hide", ids: selectedIds })}
            className="bg-slate-600 hover:bg-slate-700"
          >
            Hide
          </Button>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            disabled={isPending}
            onClick={() => setConfirm({ type: "delete", ids: selectedIds })}
          >
            Delete
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

        {listings.map((listing) => (
          <div key={listing.id} className="flex items-center gap-3 p-4 hover:bg-slate-50">
            <Checkbox
              checked={selected.has(listing.id)}
              onCheckedChange={() => toggleOne(listing.id)}
              aria-label={`Select ${listing.title}`}
              className="shrink-0"
            />

            <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-brand-light text-brand/40">
              {listing.imageUrl ? (
                <Image src={listing.imageUrl} alt={listing.title} fill sizes="64px" quality={82} className="object-cover" />
              ) : (
                <ImageOff className="size-5" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/admin/listings/${listing.id}`}
                  className="truncate text-sm font-bold text-slate-800 hover:text-brand hover:underline"
                >
                  {listing.title}
                </Link>
                <Badge className={`shrink-0 ${ADMIN_STATUS_STYLES[listing.status] ?? "bg-slate-100 text-slate-600"}`}>
                  {ADMIN_STATUS_LABELS[listing.status] ?? listing.status}
                </Badge>
                {listing.isExpired && (
                  <Badge className="shrink-0 gap-1 bg-orange-100 text-orange-700">
                    <AlertTriangle className="size-3" />
                    Expired
                  </Badge>
                )}
                {listing.isFeatured && (
                  <Badge className="shrink-0 gap-1 bg-amber-100 text-amber-700">
                    <Star className="size-3 fill-amber-500 text-amber-500" />
                    Featured
                  </Badge>
                )}
                {listing.isBumped && (
                  <Badge className="shrink-0 gap-1 bg-blue-100 text-blue-700">
                    <TrendingUp className="size-3" />
                    Bumped
                  </Badge>
                )}
              </div>
              <p className="mt-0.5 text-sm text-slate-500">
                {currency.format(listing.price)} · {listing.location} · {listing.categoryName ?? "Uncategorized"}
                {listing.sellerName ? ` · ${listing.sellerName}` : ""}
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
              {listing.status !== "active" && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => runStatusChange([listing.id], "active")}
                  className="border-green-200 text-green-700 hover:bg-green-50 hover:text-green-700"
                >
                  Approve
                </Button>
              )}
              {listing.status !== "declined" && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => setConfirm({ type: "reject", ids: [listing.id] })}
                  className="border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-700"
                >
                  Reject
                </Button>
              )}
              {listing.status !== "removed" && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => setConfirm({ type: "hide", ids: [listing.id] })}
                >
                  Hide
                </Button>
              )}
              <Button asChild variant="outline" size="sm">
                <Link href={`/admin/listings/${listing.id}`}>Manage</Link>
              </Button>
            </div>
          </div>
        ))}
      </Card>

      <ConfirmDialog
        open={confirm !== null}
        title={
          confirm?.type === "delete"
            ? `Delete ${confirm.ids.length} listing${confirm.ids.length > 1 ? "s" : ""}?`
            : confirm?.type === "reject"
              ? `Reject ${confirm.ids.length} listing${confirm.ids.length > 1 ? "s" : ""}?`
              : `Hide ${confirm?.ids.length ?? 0} listing${(confirm?.ids.length ?? 0) > 1 ? "s" : ""}?`
        }
        message={
          confirm?.type === "delete"
            ? "This permanently deletes the listing and its photos. This can't be undone."
            : confirm?.type === "reject"
              ? "The seller will see this listing as rejected."
              : "The listing is unpublished but not deleted — it can be restored later."
        }
        confirmLabel={confirm?.type === "delete" ? "Delete" : confirm?.type === "reject" ? "Reject" : "Hide"}
        danger={confirm?.type !== "hide"}
        pending={isPending}
        onConfirm={handleConfirm}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
