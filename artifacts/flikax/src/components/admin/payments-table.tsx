"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TriangleAlert } from "lucide-react";
import {
  ADMIN_PURCHASE_STATUS_LABELS,
  ADMIN_PURCHASE_STATUS_STYLES,
  ADMIN_PLAN_TYPE_LABELS,
} from "@/lib/admin-payments";
import { markPurchaseActiveAction, revokePurchaseAction } from "@/app/admin/payments/actions";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { withAuthRetry } from "@/lib/auth-retry";

export type AdminPurchaseRow = {
  id: string;
  displayStatus: string;
  planName: string;
  planType: string;
  amount: number | null;
  currency: string | null;
  provider: string | null;
  reference: string | null;
  paymentStatus: string | null;
  expiresAt: string | null;
  createdAt: string;
  userName: string | null;
  userId: string;
  listingId: string | null;
  listingTitle: string | null;
  stuck: boolean;
};

type PendingConfirm = { type: "activate" | "revoke"; purchase: AdminPurchaseRow };

export function PaymentsTable({ purchases }: { purchases: AdminPurchaseRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<PendingConfirm | null>(null);

  function run(action: () => Promise<void>) {
    setError(null);
    startTransition(async () => {
      try {
        await withAuthRetry(action);
        setConfirm(null);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Action failed.");
      }
    });
  }

  if (purchases.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center text-sm text-slate-400">
        No purchases match these filters.
      </div>
    );
  }

  return (
    <div>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <Card className="gap-0 divide-y divide-slate-100 overflow-hidden rounded-2xl p-0 shadow-sm">
        {purchases.map((p) => (
          <div key={p.id} className="flex items-start gap-3 p-4 hover:bg-slate-50">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="truncate text-sm font-bold text-slate-800">
                  {p.userName ?? "Unknown user"}
                </span>
                <Badge className={`shrink-0 ${ADMIN_PURCHASE_STATUS_STYLES[p.displayStatus] ?? "bg-slate-100 text-slate-600"}`}>
                  {ADMIN_PURCHASE_STATUS_LABELS[p.displayStatus] ?? p.displayStatus}
                </Badge>
                {p.stuck && (
                  <Badge className="shrink-0 gap-1 bg-orange-100 text-orange-700">
                    <TriangleAlert className="size-3" />
                    Stuck
                  </Badge>
                )}
              </div>
              <p className="mt-0.5 text-sm text-slate-500">
                {p.planName} ({ADMIN_PLAN_TYPE_LABELS[p.planType] ?? p.planType})
                {p.amount != null && (
                  <>
                    {" "}
                    · {p.currency ?? "GHS"} {p.amount.toFixed(2)}
                  </>
                )}
                {p.provider && <> · {p.provider}</>}
                {" "}· {new Date(p.createdAt).toLocaleDateString()}
                {p.expiresAt && <> · expires {new Date(p.expiresAt).toLocaleDateString()}</>}
              </p>
              {p.reference && <p className="mt-0.5 truncate text-xs text-slate-400">Ref: {p.reference}</p>}
              {p.listingId && p.listingTitle && (
                <p className="mt-0.5 text-sm text-slate-500">
                  Listing:{" "}
                  <Link href={`/admin/listings/${p.listingId}`} className="text-brand hover:underline">
                    {p.listingTitle}
                  </Link>
                </p>
              )}
            </div>

            <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
              {p.displayStatus !== "active" && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => setConfirm({ type: "activate", purchase: p })}
                  className="border-green-200 text-green-700 hover:bg-green-50 hover:text-green-700"
                >
                  Mark active
                </Button>
              )}
              {p.displayStatus === "active" && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => setConfirm({ type: "revoke", purchase: p })}
                  className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-700"
                >
                  Revoke
                </Button>
              )}
              <Button asChild variant="outline" size="sm">
                <Link href={`/admin/users/${p.userId}`}>View user</Link>
              </Button>
            </div>
          </div>
        ))}
      </Card>

      <ConfirmDialog
        open={confirm?.type === "activate"}
        title="Mark this purchase active?"
        message="Use this only when the payment actually succeeded on the provider side but didn't webhook correctly. This applies the same effect a successful payment would (featured badge, bump, etc.)."
        confirmLabel="Mark active"
        danger={false}
        pending={isPending}
        onConfirm={() => confirm && run(() => markPurchaseActiveAction(confirm.purchase.id))}
        onCancel={() => setConfirm(null)}
      />

      <ConfirmDialog
        open={confirm?.type === "revoke"}
        title="Revoke this purchase?"
        message="Ends it immediately and reverses its listing effect (clears the featured badge or bump). This can't be undone."
        confirmLabel="Revoke"
        pending={isPending}
        onConfirm={() => confirm && run(() => revokePurchaseAction(confirm.purchase.id))}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
