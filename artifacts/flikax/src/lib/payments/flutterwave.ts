// Purchase flow: thin Flutterwave API wrapper used by two call sites --
// initializeFlutterwavePayment() from the /initialize route (step 2, kicks
// off the redirect to Flutterwave's hosted checkout) and
// verifyFlutterwaveSignature() from the /webhook route (gatekeeper that runs
// before we trust anything Flutterwave posts back to us).
const FLUTTERWAVE_BASE_URL = "https://api.flutterwave.com/v3";

type FlutterwaveInitializeResponse = {
  status: string;
  message: string;
  data?: { link: string };
};

/** Returns null if FLUTTERWAVE_SECRET_KEY isn't configured. */
export function getFlutterwaveSecretKey(): string | null {
  return process.env.FLUTTERWAVE_SECRET_KEY || null;
}

export async function initializeFlutterwavePayment(params: {
  email: string;
  amountGHS: number;
  reference: string;
  redirectUrl: string;
}): Promise<FlutterwaveInitializeResponse> {
  const secretKey = getFlutterwaveSecretKey();
  if (!secretKey) {
    return { status: "error", message: "Flutterwave is not configured (missing FLUTTERWAVE_SECRET_KEY)." };
  }

  const res = await fetch(`${FLUTTERWAVE_BASE_URL}/payments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tx_ref: params.reference,
      amount: params.amountGHS,
      currency: "GHS",
      redirect_url: params.redirectUrl,
      customer: { email: params.email },
    }),
  });

  return res.json();
}

/** Flutterwave webhooks are verified with a shared secret hash, not a computed signature. */
export function verifyFlutterwaveSignature(signature: string | null): boolean {
  const secretHash = process.env.FLUTTERWAVE_SECRET_HASH;
  if (!secretHash || !signature) return false;
  // Security-critical: unlike Paystack, Flutterwave doesn't HMAC-sign the
  // body -- it just expects the `verif-hash` header to equal a static
  // secret you configured in the Flutterwave dashboard. It's a simpler
  // check but serves the same purpose: reject any webhook call that
  // doesn't prove knowledge of a value only Flutterwave (and us) has.
  // Must run before the webhook route trusts event.data.
  return signature === secretHash;
}
