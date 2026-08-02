"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

// Purchase flow step 1 (client side, the very start): renders the two "Pay
// with ..." buttons. On click it only asks our own /initialize route for a
// hosted checkout URL and full-page-redirects there -- it never talks to
// Paystack/Flutterwave directly and never sees a secret key. Whether the
// payment actually succeeded is decided later by the provider's webhook,
// not by anything that happens in this component.
export function PlanPurchaseButton({ planId }: { planId: string }) {
  const [loading, setLoading] = useState<"paystack" | "flutterwave" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function pay(provider: "paystack" | "flutterwave") {
    setLoading(provider);
    setError(null);

    const res = await fetch(`/api/payments/${provider}/initialize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId }),
    });
    const data = await res.json();

    if (!res.ok || !data.url) {
      setLoading(null);
      setError(data.error ?? "Something went wrong. Please try again.");
      return;
    }

    window.location.href = data.url;
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => pay("paystack")} disabled={loading !== null} size="sm" className="flex-1">
          {loading === "paystack" ? "Redirecting..." : "Pay with Paystack"}
        </Button>
        <Button
          type="button"
          onClick={() => pay("flutterwave")}
          disabled={loading !== null}
          variant="outline"
          size="sm"
          className="flex-1"
        >
          {loading === "flutterwave" ? "Redirecting..." : "Pay with Flutterwave"}
        </Button>
      </div>
      {error && <p className="mt-2 text-xs text-red-600" role="alert">{error}</p>}
    </div>
  );
}
