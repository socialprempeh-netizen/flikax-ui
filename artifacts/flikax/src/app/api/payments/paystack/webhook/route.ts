import { NextResponse } from "next/server";
import { PAYMENTS_ENABLED } from "@/lib/payments/config";
import { verifyPaystackSignature } from "@/lib/payments/paystack";
import { markPaymentSuccess } from "@/lib/payments/mark-payment-success";
import { paystackWebhookEventSchema } from "@/lib/payments/schemas";

// Purchase flow step 3: Paystack calls this server-to-server after a
// checkout completes (independent of whether the user's browser ever makes
// it back to /dashboard). This -- not the initialize route, not the
// client -- is the only trigger for markPaymentSuccess(), which is the
// only place a payment actually gets marked successful.
export const runtime = "nodejs"; // needs Node's crypto (via verifyPaystackSignature), not the Edge runtime.

export async function POST(request: Request) {
  if (!PAYMENTS_ENABLED) {
    return NextResponse.json({ error: "Payments are not enabled." }, { status: 404 });
  }

  // Read the body as raw text (not request.json()) because signature
  // verification is computed over the exact byte string Paystack sent --
  // parsing and re-serializing JSON could change whitespace and break the
  // HMAC comparison.
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  // Security-critical: reject anything that isn't provably from Paystack
  // BEFORE touching its contents. Never parse/act on `event` first.
  if (!verifyPaystackSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  // Parsed only after the signature check above -- this schema is a shape
  // guard against our own assumptions (event.data.reference existing), not
  // a trust boundary, since verifyPaystackSignature() is what actually
  // proves the request came from Paystack.
  const parsedEvent = paystackWebhookEventSchema.safeParse(JSON.parse(rawBody));
  if (!parsedEvent.success) {
    return NextResponse.json({ error: "Unrecognized event payload." }, { status: 400 });
  }
  const event = parsedEvent.data;

  if (event.event === "charge.success" && event.data?.reference) {
    await markPaymentSuccess(event.data.reference);
  }

  return NextResponse.json({ received: true });
}
