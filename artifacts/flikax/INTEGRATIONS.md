# Integrations

Every third-party service this app depends on, what it's used for, and
exactly which env vars each one needs. Companion to
[ARCHITECTURE.md](./ARCHITECTURE.md), [API.md](./API.md).

## Quick status: what's actually configured right now

As of this writing, this repo's `.env.local` contains exactly two
variables — `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
(both present as keys, values blank in this checkout) — and the linked
Vercel project (`flikax-ui`, see `.vercel/project.json` at the repo root)
has the same two variables set across Production/Preview/Development and
nothing else (`vercel env ls`). Every other integration below —
service-role Supabase access, both payment providers, a custom site URL —
is **unconfigured** in both places as of this writing. Don't assume any of
the flows below are live in production without checking current env var
state first (`vercel env ls`, or the dashboard).

## Supabase

The only backend. Five client factories in `src/lib/supabase/`, each for a
different trust context — see ARCHITECTURE.md's "Supabase client layer"
for the full breakdown. Summary:

| Client | File | Auth | Use |
|---|---|---|---|
| Browser | `client.ts` | cookie session | `"use client"` components |
| Server | `server.ts` | cookie session, memoized | Server Components, Server Actions, Route Handlers |
| Public | `public.ts` | anon key only, no cookies | Data that must stay static/ISR-eligible |
| Middleware | `middleware.ts` | cookie session | Root middleware's session-refresh |
| Admin | `admin.ts` | service-role key, bypasses RLS | Privileged admin-only reads/writes; returns `null` (never throws) if the key isn't configured |

**Features used:**
- **Auth** — email/OTP sign-in, `resetPasswordForEmail` (delegates entirely
  to Supabase's own dashboard-configured SMTP — see "Email delivery"
  below), Google/Facebook OAuth via PKCE (`src/app/auth/callback/route.ts`
  handles the code exchange; the OAuth app credentials themselves are
  configured on the Supabase dashboard, not in this repo), and the Admin
  API (`auth.admin.*`) for ban/delete/etc. from the admin panel.
- **Database (Postgres)** — standard REST queries everywhere, plus RPC
  calls to Postgres functions (see [DATABASE.md](./DATABASE.md) for the
  full list — `search_listings`, `get_listing_contact_phone`,
  `get_top_sellers`, `increment_listing_views`, `reveal_phone`,
  `mark_conversation_read`, `get_seller_listing_stats`, `category_counts`,
  `get_public_seller_profile`).
- **Storage** — three buckets: `listing-images`, `homepage-slides`,
  `avatars` (see DATABASE.md for what's in each and their write policies).
  Also whitelisted as a Next.js remote image pattern in `next.config.ts`
  (hostname derived dynamically from `NEXT_PUBLIC_SUPABASE_URL`).
- **Realtime** — one usage: `src/components/messages/chat-thread.tsx`
  subscribes to a `postgres_changes` channel per open conversation
  (`INSERT` on `messages`, `UPDATE` on `conversations`), unsubscribed on
  cleanup.

**Env vars:**

| Var | Required for | Where it's set today |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | every client | `.env.local` + Vercel (all environments) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | every client | `.env.local` + Vercel (all environments) |
| `SUPABASE_SERVICE_ROLE_KEY` | admin client (user ban/delete, payment reconciliation, `deleteAccountAction`) | **Not set anywhere** — every admin-panel action requiring it, and account self-deletion, will fail until this is added |

## Email delivery (Resend, via Supabase Auth SMTP)

**No custom email-sending code exists anywhere in this repo.** There is no
`RESEND_API_KEY`, no SMTP env var, no `nodemailer`/`resend`/similar
dependency, and no code path that constructs or sends an email directly.
Every transactional email this app sends — signup confirmation, password
reset (`resetPasswordForEmail()` in
`src/components/auth/forgot-password-form.tsx`), etc. — is delegated
**entirely** to Supabase Auth's own dashboard-configured custom SMTP
(Resend, `smtp.resend.com:465`, sender `noreply@flikax.com` per the
current dashboard config).

This means:
- **Nothing in this codebase can diagnose or fix email deliverability
  problems.** If confirmation emails aren't arriving, the cause and the fix
  both live outside this repo — check, in order: (1) Resend's dashboard for
  `flikax.com` domain verification status (SPF/DKIM/DMARC DNS records —
  the most common cause of "SMTP accepted, email never delivered"), (2)
  Supabase's Auth → Emails → SMTP Settings page for the actual configured
  host/port/credentials/sender, (3) Resend's own delivery logs for the
  specific rejected/bounced send.
- There's no app-level template customization either — email copy/branding
  is whatever's configured in Supabase's Auth email templates, not
  anything in `src/`.
- If a custom transactional-email flow is ever added at the app level
  (e.g. for something Supabase Auth doesn't cover), there is no existing
  pattern to extend — it would be new infrastructure, not a variation on
  something already here.

## Paystack

`src/lib/payments/paystack.ts`. Ghana-focused payment provider, used for
premium plan purchases (featured listings, bumps, subscriptions).

- `initializePaystackTransaction()` — POSTs to
  `https://api.paystack.co/transaction/initialize`, amount converted to
  the smallest currency unit (pesewas) per Paystack's API contract.
- `verifyPaystackSignature()` — HMAC-SHA512 over the *raw* webhook body
  using `PAYSTACK_SECRET_KEY`, compared with `crypto.timingSafeEqual`
  (constant-time, to avoid a timing side-channel).

**Flow**: `POST /api/payments/paystack/initialize` (creates `pending`
`payments`/`purchases` rows, returns Paystack's hosted checkout URL) →
buyer completes checkout on Paystack's page → Paystack calls
`POST /api/payments/paystack/webhook` → on `charge.success`,
`markPaymentSuccess()` activates the purchase and applies its effect
(featured/bumped) to the listing. Full detail in [API.md](./API.md).

**Enabled?** No — gated by `PAYMENTS_ENABLED` (see "The payments kill
switch" below). Both routes 404 while it's off.

**Env vars**: `PAYSTACK_SECRET_KEY` — declared in `.env.example`, not set
in `.env.local` or Vercel today.

## Flutterwave

`src/lib/payments/flutterwave.ts` — structurally mirrors Paystack, same
purpose, second provider option.

- `initializeFlutterwavePayment()` — POSTs to
  `https://api.flutterwave.com/v3/payments`, amount in GHS as-is (not
  converted to a sub-unit, unlike Paystack).
- `verifyFlutterwaveSignature()` — checks the `verif-hash` webhook header
  against a **static** `FLUTTERWAVE_SECRET_HASH` (Flutterwave's own
  webhook model is a shared-secret equality check, not a signature
  computed over the payload — meaning this value is exactly as sensitive
  as an API key and should be guarded the same way, since possessing it is
  sufficient to forge a webhook event).

**Flow**: identical shape to Paystack —
`POST /api/payments/flutterwave/initialize` → Flutterwave's hosted
checkout → `POST /api/payments/flutterwave/webhook` on
`charge.completed` + `status: "successful"` → same
`markPaymentSuccess()`.

**Enabled?** No — same `PAYMENTS_ENABLED` flag as Paystack.

**Env vars**: `FLUTTERWAVE_SECRET_KEY`, `FLUTTERWAVE_SECRET_HASH` —
declared in `.env.example`, neither set in `.env.local` or Vercel today.

## The payments kill switch

`src/lib/payments/config.ts` reads `PAYMENTS_ENABLED === "true"` as a
single global on/off for **both** providers — both initialize routes and
both webhook routes 404 while it's `false`/unset (today's state). A
*separate* DB feature flag, `featured_tier_enabled`, independently
controls whether `/premium` shows real plans or a placeholder — flipping
one doesn't flip the other. Before a real purchase can complete in
production, all of the following need to happen together:
1. `PAYMENTS_ENABLED=true` set in the deployment environment.
2. Real `PAYSTACK_SECRET_KEY`/`FLUTTERWAVE_SECRET_KEY`/
   `FLUTTERWAVE_SECRET_HASH` set.
3. `featured_tier_enabled` flipped on (`feature_flags` table, or the admin
   settings panel).
4. Both providers' webhook URLs (`/api/payments/paystack/webhook`,
   `/api/payments/flutterwave/webhook`) registered in their respective
   dashboards against the production domain.

## Vercel

Deployment platform. The workspace root (one level up from this package)
has `.vercel/project.json` linking this checkout to the `flikax-ui`
project (org `team_FTw62qi8TbpAiHv7HDpjofoc`) — `vercel env ls` /
`vercel env pull` work directly from there once the Vercel CLI is
authenticated.

- `src/lib/site-url.ts`'s `getSiteUrl()` — fallback chain:
  `NEXT_PUBLIC_SITE_URL` (explicit override) →
  `VERCEL_PROJECT_PRODUCTION_URL` (Vercel's own auto-populated System
  Environment Variable, no dashboard config needed, self-updates if the
  production domain ever changes) → `http://localhost:3000`. Every
  canonical URL/OG tag/JSON-LD/sitemap entry in the app goes through this.
- `next.config.ts`'s image config relies on Vercel's built-in image
  optimizer (no extra infrastructure needed on this platform) — see
  DESIGN_SYSTEM.md / the Lighthouse-driven fix that enabled it.
- No `vercel.json`/`vercel.ts` exists in this package — deployment
  configuration is Vercel's Next.js zero-config auto-detection, nothing
  custom.

**Env vars**: `NEXT_PUBLIC_SITE_URL` (optional override; not currently
set — the app falls back to `VERCEL_PROJECT_PRODUCTION_URL` in
production). `VERCEL_PROJECT_PRODUCTION_URL` is platform-injected, never
set manually.

## Everything else in `package.json` — confirmed NOT external services

Reviewed every dependency; only the ones above call out to a real external
API. Notably:
- **`sharp`** — local image processing only (watermarking in
  `src/lib/watermark.ts`, perceptual hashing in `src/lib/image-hash.ts`).
  No network calls. Also what Vercel's/Next's own image optimizer uses
  under the hood, which is why enabling `images.unoptimized: false`
  doesn't require adding a new dependency.
- **`zod`** — validation only (payment webhook/request schemas), not a
  service.
- `recharts`, `framer-motion`, `lucide-react`, `react-icons`, `radix-ui`,
  `class-variance-authority`, `clsx`, `tailwind-merge`, `next-themes` — all
  pure client-side UI libraries.
- No analytics SDK (no gtag/PostHog/Sentry/Mixpanel/Segment), no maps SDK,
  no SMS provider, no other payment/email SDK anywhere in the dependency
  tree.

## Full env var reference

| Var | Integration | In `.env.example` | Currently set (local + Vercel) |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase | Yes | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase | Yes | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase (admin client) | Yes | **No** |
| `NEXT_PUBLIC_SITE_URL` | Vercel/canonical URLs | Yes | No (falls back to Vercel's own var) |
| `PAYMENTS_ENABLED` | Payments kill switch | Yes | No |
| `PAYSTACK_SECRET_KEY` | Paystack | Yes | No |
| `FLUTTERWAVE_SECRET_KEY` | Flutterwave | Yes | No |
| `FLUTTERWAVE_SECRET_HASH` | Flutterwave | Yes | No |
| `VERCEL_PROJECT_PRODUCTION_URL` | Vercel (auto-injected) | No (platform-provided) | N/A |

No env var for Resend/SMTP exists anywhere in this repo — see "Email
delivery" above for why.
