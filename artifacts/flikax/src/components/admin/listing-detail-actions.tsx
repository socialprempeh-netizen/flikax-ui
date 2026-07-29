"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateListingStatusAction,
  deleteListingsAction,
  updateListingCategoryAction,
  extendListingExpiryAction,
  clearFeaturedAction,
  clearBumpAction,
} from "@/app/admin/listings/actions";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { withAuthRetry } from "@/lib/auth-retry";

type PendingConfirm = { type: "reject" | "hide" | "delete" };

export function ListingDetailActions({
  listingId,
  status,
  categoryId,
  categories,
  isFeatured,
  isBumped,
}: {
  listingId: string;
  status: string;
  categoryId: string;
  categories: { id: string; name: string }[];
  isFeatured: boolean;
  isBumped: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<PendingConfirm | null>(null);
  const [selectedCategory, setSelectedCategory] = useState(categoryId);

  function setStatus(newStatus: string) {
    setError(null);
    startTransition(async () => {
      try {
        await withAuthRetry(() => updateListingStatusAction([listingId], newStatus));
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Action failed.");
      }
    });
  }

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      try {
        await withAuthRetry(() => deleteListingsAction([listingId]));
        router.push("/admin/listings");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Delete failed.");
        setConfirm(null);
      }
    });
  }

  function saveCategory() {
    setError(null);
    startTransition(async () => {
      try {
        await withAuthRetry(() => updateListingCategoryAction(listingId, selectedCategory));
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not update category.");
      }
    });
  }

  function extendExpiry(days: number) {
    setError(null);
    startTransition(async () => {
      try {
        await withAuthRetry(() => extendListingExpiryAction(listingId, days));
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not extend expiry.");
      }
    });
  }

  function removeFeatured() {
    setError(null);
    startTransition(async () => {
      try {
        await withAuthRetry(() => clearFeaturedAction(listingId));
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not clear featured status.");
      }
    });
  }

  function removeBump() {
    setError(null);
    startTransition(async () => {
      try {
        await withAuthRetry(() => clearBumpAction(listingId));
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not clear bump status.");
      }
    });
  }

  function handleConfirm() {
    if (!confirm) return;
    if (confirm.type === "delete") handleDelete();
    else if (confirm.type === "reject") {
      setStatus("declined");
      setConfirm(null);
    } else if (confirm.type === "hide") {
      setStatus("removed");
      setConfirm(null);
    }
  }

  return (
    <Card className="gap-0 rounded-2xl p-5 shadow-sm">
      <h2 className="text-sm font-bold text-slate-800">Moderation actions</h2>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-3 flex flex-wrap gap-2">
        {status !== "active" && (
          <Button
            type="button"
            size="sm"
            disabled={isPending}
            onClick={() => setStatus("active")}
            className="bg-green-600 hover:bg-green-700"
          >
            Approve
          </Button>
        )}
        {status !== "declined" && (
          <Button
            type="button"
            size="sm"
            disabled={isPending}
            onClick={() => setConfirm({ type: "reject" })}
            className="bg-amber-600 hover:bg-amber-700"
          >
            Reject
          </Button>
        )}
        {status !== "removed" && (
          <Button
            type="button"
            size="sm"
            disabled={isPending}
            onClick={() => setConfirm({ type: "hide" })}
            className="bg-slate-600 hover:bg-slate-700"
          >
            Hide
          </Button>
        )}
        <Button type="button" size="sm" variant="destructive" disabled={isPending} onClick={() => setConfirm({ type: "delete" })}>
          Delete
        </Button>
      </div>

      <div className="mt-5 border-t border-slate-100 pt-4">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Category
        </span>
        <div className="flex gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-9 flex-1 rounded-md border border-input bg-transparent px-3 text-sm text-slate-800 shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isPending || selectedCategory === categoryId}
            onClick={saveCategory}
          >
            Save
          </Button>
        </div>
      </div>

      <div className="mt-5 border-t border-slate-100 pt-4">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Expiry
        </span>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="outline" disabled={isPending} onClick={() => extendExpiry(30)}>
            +30 days
          </Button>
          <Button type="button" size="sm" variant="outline" disabled={isPending} onClick={() => extendExpiry(90)}>
            +90 days
          </Button>
        </div>
      </div>

      {(isFeatured || isBumped) && (
        <div className="mt-5 border-t border-slate-100 pt-4">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Manual overrides
          </span>
          <div className="flex flex-wrap gap-2">
            {isFeatured && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={removeFeatured}
                className="border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-700"
              >
                Remove featured
              </Button>
            )}
            {isBumped && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={removeBump}
                className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-700"
              >
                Remove bump
              </Button>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirm !== null}
        title={confirm?.type === "delete" ? "Delete this listing?" : confirm?.type === "reject" ? "Reject this listing?" : "Hide this listing?"}
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
    </Card>
  );
}
