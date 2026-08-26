import { z } from "zod";

// Body shape for both /api/payments/paystack/initialize and
// /api/payments/flutterwave/initialize -- their only caller is
// PlanPurchaseButton, which always sends { planId, listingId? }.
export const purchaseInitializeSchema = z.object({
  planId: z.string().min(1),
  listingId: z.string().min(1).optional(),
});

// Paystack's webhook body has many more fields than this -- passthrough()
// lets the rest through unvalidated since verifyPaystackSignature() already
// proved the request is genuinely from Paystack before this schema runs;
// this only pins down the two fields the webhook route actually reads.
export const paystackWebhookEventSchema = z
  .object({
    event: z.string(),
    data: z.object({ reference: z.string() }).passthrough().optional(),
  })
  .passthrough();

// Same reasoning as paystackWebhookEventSchema -- verifyFlutterwaveSignature()
// is the real gate; this just pins down the fields the route reads.
export const flutterwaveWebhookEventSchema = z
  .object({
    event: z.string(),
    data: z
      .object({ status: z.string().optional(), tx_ref: z.string().optional() })
      .passthrough()
      .optional(),
  })
  .passthrough();
