import { createHmac } from "node:crypto";

// Purchase flow: thin Paystack API wrapper used by two call sites --
// initializePaystackTransaction() from the /initialize route (step 2, kicks
// off the redirect to Paystack's hosted checkout) and
// verifyPaystackSignature() from the /webhook route (gatekeeper that runs
// before we trust anything Paystack posts back to us).
const PAYSTACK_BASE_URL = "https://api.paystack.co";

type PaystackInitializeResponse = {
  status: boolean;
  message: string;
  data?: { authorization_url: string; access_code: string; reference: string };
};

/** Returns null if PAYSTACK_SECRET_KEY isn't configured. */
export function getPaystackSecretKey(): string | null {
  return process.env.PAYSTACK_SECRET_KEY || null;
}

export async function initializePaystackTransaction(params: {
  email: string;
  amountGHS: number;
  reference: string;
  callbackUrl: string;
}): Promise<PaystackInitializeResponse> {
  const secretKey = getPaystackSecretKey();
  if (!secretKey) {
    return { status: false, message: "Paystack is not configured (missing PAYSTACK_SECRET_KEY)." };
  }

  const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: params.email,
      amount: Math.round(params.amountGHS * 100), // Paystack expects the smallest currency unit (pesewas).
      currency: "GHS",
      reference: params.reference,
      callback_url: params.callbackUrl,
    }),
  });

  return res.json();
}

/** Verifies the `x-paystack-signature` header per Paystack's webhook spec (HMAC SHA512 of the raw body). */
export function verifyPaystackSignature(rawBody: string, signature: string | null): boolean {
  const secretKey = getPaystackSecretKey();
  if (!secretKey || !signature) return false;

  // Security-critical: this is the only thing standing between "Paystack
  // told us this payment succeeded" and "anyone on the internet POSTed to
  // our webhook URL claiming a payment succeeded." We recompute the HMAC
  // ourselves from the raw (unparsed) body using our secret key -- an
  // attacker without that key cannot produce a matching signature. The
  // webhook route must call this BEFORE parsing/trusting the body.
  const expected = createHmac("sha512", secretKey).update(rawBody).digest("hex");
  return expected === signature;
}
