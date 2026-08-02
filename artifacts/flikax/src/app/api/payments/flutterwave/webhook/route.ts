import { NextResponse } from "next/server";
import { PAYMENTS_ENABLED } from "@/lib/payments/config";
import { verifyFlutterwaveSignature } from "@/lib/payments/flutterwave";
import { markPaymentSuccess } from "@/lib/payments/mark-payment-success";

// Purchase flow step 3: Flutterwave calls this server-to-server after a
// checkout completes (independent of whether the user's browser ever makes
// it back to /dashboard). This -- not the initialize route, not the
// client -- is the only trigger for markPaymentSuccess(), which is the
// only place a payment actually gets marked successful.
export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!PAYMENTS_ENABLED) {
    return NextResponse.json({ error: "Payments are not enabled." }, { status: 404 });
  }

  // Security-critical: reject anything that isn't provably from Flutterwave
  // BEFORE touching its contents. Never parse/act on `event` first.
  const signature = request.headers.get("verif-hash");
  if (!verifyFlutterwaveSignature(signature)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  const event = await request.json();

  if (event.event === "charge.completed" && event.data?.status === "successful") {
    await markPaymentSuccess(event.data.tx_ref);
  }

  return NextResponse.json({ received: true });
}
