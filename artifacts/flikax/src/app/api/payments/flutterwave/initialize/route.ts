import { NextResponse } from "next/server";
import { createClient, getUser } from "@/lib/supabase/server";
import { PAYMENTS_ENABLED } from "@/lib/payments/config";
import { createPendingPurchase } from "@/lib/payments/create-pending-purchase";
import { initializeFlutterwavePayment } from "@/lib/payments/flutterwave";
import { purchaseInitializeSchema } from "@/lib/payments/schemas";

// Purchase flow step 2: hit by PlanPurchaseButton's "Pay with Flutterwave"
// click. Mirrors the Paystack initialize route -- authenticates the caller,
// records a pending payment/purchase row (createPendingPurchase), then asks
// Flutterwave for a hosted payment link and hands it back to the browser to
// redirect to. No money moves here -- that only happens on Flutterwave's
// page, and we only find out via the webhook.
export async function POST(request: Request) {
  if (!PAYMENTS_ENABLED) {
    return NextResponse.json({ error: "Payments are not enabled." }, { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const parsedBody = purchaseInitializeSchema.safeParse(await request.json().catch(() => null));
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const { planId, listingId } = parsedBody.data;

  const pending = await createPendingPurchase({
    supabase,
    userId: user.id,
    planId,
    listingId,
    provider: "flutterwave",
  });

  if ("error" in pending) {
    const status = pending.error === "plan_not_found" ? 404 : pending.error === "insert_failed" ? 500 : 400;
    return NextResponse.json({ error: pending.error }, { status });
  }

  const { origin } = new URL(request.url);
  const result = await initializeFlutterwavePayment({
    email: user.email ?? `${user.id}@flikax-users.com`,
    amountGHS: pending.amount,
    reference: pending.reference,
    redirectUrl: `${origin}/dashboard`,
  });

  if (result.status !== "success" || !result.data) {
    return NextResponse.json({ error: result.message }, { status: 502 });
  }

  return NextResponse.json({ url: result.data.link });
}
