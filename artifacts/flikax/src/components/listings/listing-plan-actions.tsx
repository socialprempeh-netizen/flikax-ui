"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { PremiumPlan } from "@/lib/premium-plans";

export function ListingPlanActions({
  listingId,
  plans,
  isFeatured,
}: {
  listingId: string;
  plans: PremiumPlan[];
  isFeatured: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // A listing that's already featured doesn't need another featured_spot plan,
  // but bump_fee/pay_per_ad still apply regardless of featured status.
  const availablePlans = plans.filter((p) => p.plan_type !== "featured_spot" || !isFeatured);
  if (availablePlans.length === 0) return null;

  async function pay(planId: string, provider: "paystack" | "flutterwave") {
    const key = `${planId}-${provider}`;
    setLoadingKey(key);
    setError(null);

    const res = await fetch(`/api/payments/${provider}/initialize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId, listingId }),
    });
    const data = await res.json();

    if (!res.ok || !data.url) {
      setLoadingKey(null);
      setError(data.error ?? "Something went wrong. Please try again.");
      return;
    }

    window.location.href = data.url;
  }

  if (!expanded) {
    return (
      <Button
        type="button"
        onClick={() => setExpanded(true)}
        variant="link"
        className="relative z-10 mt-2 h-auto p-0 text-sm"
      >
        Boost this ad
      </Button>
    );
  }

  return (
    <div className="relative z-10 mt-2 space-y-2 border border-dashed border-neutral-200 p-3">
      {availablePlans.map((plan) => (
        <div key={plan.id} className="flex items-center justify-between gap-2">
          <p className="text-xs text-neutral-600">
            {plan.name} — GH₵{plan.price}
            {plan.duration_days ? ` (${plan.duration_days}d)` : ""}
          </p>
          <div className="flex shrink-0 gap-1">
            <Button
              type="button"
              onClick={() => pay(plan.id, "paystack")}
              disabled={loadingKey !== null}
              size="xs"
            >
              {loadingKey === `${plan.id}-paystack` ? "..." : "Paystack"}
            </Button>
            <Button
              type="button"
              onClick={() => pay(plan.id, "flutterwave")}
              disabled={loadingKey !== null}
              variant="outline"
              size="xs"
            >
              {loadingKey === `${plan.id}-flutterwave` ? "..." : "Flutterwave"}
            </Button>
          </div>
        </div>
      ))}
      {error && <p className="text-xs text-red-600" role="alert">{error}</p>}
    </div>
  );
}
