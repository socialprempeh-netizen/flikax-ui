import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { LISTING_SCOPED_PLAN_TYPES, type PlanType } from "@/lib/premium-plans";

// Purchase flow step 1 (server side): called from each provider's
// /initialize route right after the buy button click. Runs with the
// signed-in user's own cookie-scoped Supabase client (not the admin
// client), so ownership checks below are backed by real auth rather than
// caller-supplied data. Writes a "pending" payment + purchase row *before*
// we ever talk to Paystack/Flutterwave, so the reference we hand the
// provider always maps back to a known user/plan/listing when the webhook
// eventually calls markPaymentSuccess().
type PendingPurchaseError =
  | "plan_not_found"
  | "listing_required"
  | "listing_not_found_or_forbidden"
  | "insert_failed";

/** Verifies the plan is enabled (and listing ownership where required), then records a pending payment + purchase. */
export async function createPendingPurchase({
  supabase,
  userId,
  planId,
  listingId,
  provider,
}: {
  supabase: SupabaseClient<Database>;
  userId: string;
  planId: string;
  listingId?: string;
  provider: "paystack" | "flutterwave";
}): Promise<{ reference: string; amount: number } | { error: PendingPurchaseError }> {
  const { data: plan } = await supabase
    .from("premium_plans")
    .select("id, price, plan_type, is_enabled")
    .eq("id", planId)
    .eq("is_enabled", true)
    .maybeSingle();

  if (!plan) return { error: "plan_not_found" };

  const isListingScoped = LISTING_SCOPED_PLAN_TYPES.includes(plan.plan_type as PlanType);

  if (isListingScoped) {
    if (!listingId) return { error: "listing_required" };
    // Ownership check: without this, any signed-in user could pass someone
    // else's listingId and pay to feature/bump a listing they don't own.
    const { data: listing } = await supabase
      .from("listings")
      .select("id, user_id")
      .eq("id", listingId)
      .maybeSingle();
    if (!listing || listing.user_id !== userId) {
      return { error: "listing_not_found_or_forbidden" };
    }
  }

  // This reference is the shared key that ties everything together: it's
  // sent to the provider on initialize, echoed back in the webhook payload,
  // and used by markPaymentSuccess() to look up this exact payment row.
  const reference = `flikax_plan_${randomUUID()}`;

  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .insert({
      user_id: userId,
      listing_id: isListingScoped ? (listingId ?? null) : null,
      provider,
      reference,
      amount: plan.price,
      currency: "GHS",
      status: "pending",
    })
    .select("id")
    .single();

  if (paymentError || !payment) return { error: "insert_failed" };

  const { error: purchaseError } = await supabase.from("purchases").insert({
    user_id: userId,
    plan_id: planId,
    listing_id: isListingScoped ? (listingId ?? null) : null,
    payment_id: payment.id,
    status: "pending",
  });

  if (purchaseError) return { error: "insert_failed" };

  return { reference, amount: plan.price };
}
