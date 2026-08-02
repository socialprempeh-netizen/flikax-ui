import { createAdminClient } from "@/lib/supabase/admin";

// Purchase flow step 4 (final): THE single place in the codebase where a
// payment is marked successful and its purchase activated (plan applied,
// listing featured/bumped). Only the two webhook routes call this -- never
// the client, and never the /initialize routes -- because by this point
// the provider has already verified the money moved; we're just
// reconciling our own records to match. Do not duplicate this logic
// elsewhere or call it from anywhere that hasn't already verified the
// provider's webhook signature.
/** Idempotent: safe to call more than once for the same reference (webhooks can retry/duplicate). */
export async function markPaymentSuccess(reference: string): Promise<{ ok: boolean; reason?: string }> {
  // Uses the service-role ("admin") client, not the cookie-scoped one: this
  // function runs from a webhook request that has no signed-in user/session
  // to authenticate as, and it must be able to write to other users'
  // payment/purchase/listing rows regardless of RLS policies. The route
  // above already gated access via signature verification, so it's safe to
  // bypass row-level security here.
  const admin = createAdminClient();
  if (!admin) return { ok: false, reason: "admin client not configured (missing SUPABASE_SERVICE_ROLE_KEY)" };

  const { data: payment } = await admin
    .from("payments")
    .select("*")
    .eq("reference", reference)
    .maybeSingle();

  if (!payment) return { ok: false, reason: "payment not found" };
  // Idempotency guard: providers retry webhooks (timeouts, at-least-once
  // delivery), and a user can also land back on /dashboard and trigger
  // re-checks. Without this early return, a replayed "success" event would
  // re-run the plan-activation logic below (extending expiry, re-featuring
  // a listing, etc.) every time it's delivered. Bailing out here is what
  // makes it safe to call this function more than once for the same
  // reference.
  if (payment.status === "success") return { ok: true };

  await admin
    .from("payments")
    .update({ status: "success", updated_at: new Date().toISOString() })
    .eq("id", payment.id);

  const { data: purchase } = await admin
    .from("purchases")
    .select("id, plan_id, listing_id")
    .eq("payment_id", payment.id)
    .maybeSingle();

  if (!purchase) return { ok: true };

  const { data: plan } = await admin
    .from("premium_plans")
    .select("plan_type, duration_days")
    .eq("id", purchase.plan_id)
    .maybeSingle();

  const startsAt = new Date();
  const expiresAt = plan?.duration_days
    ? new Date(startsAt.getTime() + plan.duration_days * 24 * 60 * 60 * 1000)
    : null;

  // Activation: this is where the paid-for benefit is actually granted.
  // Guarded above by the idempotency check, so this only ever runs once
  // per reference -- otherwise a retried webhook would keep pushing
  // starts_at/expires_at forward and effectively give free extensions.
  await admin
    .from("purchases")
    .update({
      status: "active",
      starts_at: startsAt.toISOString(),
      expires_at: expiresAt ? expiresAt.toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", purchase.id);

  if (purchase.listing_id && plan?.plan_type === "featured_spot") {
    await admin
      .from("listings")
      .update({
        is_featured: true,
        featured_until: expiresAt ? expiresAt.toISOString() : null,
      })
      .eq("id", purchase.listing_id);
  }

  if (purchase.listing_id && plan?.plan_type === "bump_fee") {
    await admin
      .from("listings")
      .update({ bumped_at: startsAt.toISOString() })
      .eq("id", purchase.listing_id);
  }

  return { ok: true };
}
