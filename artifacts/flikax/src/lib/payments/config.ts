// Purchase flow step 0: the kill switch every payment surface checks first.
// Flip PAYMENTS_ENABLED=true only once Paystack/Flutterwave keys and webhooks
// are configured for the environment -- until then this keeps buy buttons,
// initialize routes, and webhook handlers all returning 404/disabled so we
// never accept money we can't yet reconcile.
/** Server-only. Master switch for all payment/subscription UI and routes; defaults off pre-launch. */
export const PAYMENTS_ENABLED = process.env.PAYMENTS_ENABLED === "true";
