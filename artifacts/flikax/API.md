# API

Every server-side entry point in the app: Route Handlers (real HTTP
endpoints) and Server Actions (form/mutation functions called directly from
components). Companion to [ARCHITECTURE.md](./ARCHITECTURE.md) and
[DATABASE.md](./DATABASE.md).

## How auth is checked

Almost everything below calls `getUser()` (`src/lib/supabase/server.ts`) —
a per-request-memoized wrapper around `supabase.auth.getUser()` — and
either 401s or throws if there's no session. Admin routes/actions go
further: `requireAdmin()`/a local `requireAdminActor()`/
`requireSuperAdminActor()` helper additionally checks `profiles.role`
against `admin`/`super_admin` after confirming a session exists. See
ARCHITECTURE.md's "Supabase client layer" section for what each client
variant is for.

**Route Handlers and Server Actions are excluded from the root
middleware's session-refresh matcher** — each does its own session
check/refresh via the memoized `getUser()`, so they're not doubly-refreshed
by `src/middleware.ts`.

## Route Handlers (`src/app/api/**/route.ts`)

### `GET /api/locations`
Public, no auth. Returns the full region → district → suburb tree from
`locations` (`enabled = true` only), via `createPublicClient()` (anon key,
no cookies, so this stays cacheable). `Cache-Control: public, max-age=300`,
`revalidate = 300`.

### `GET /api/session-summary`
Auth optional (`getUser()`; returns a logged-out shape if none). Returns
`{ isLoggedIn, userId, avatarUrl, initials, hasUnreadMessages }`. Backs the
`useSessionSummary()` client hook that drives the header — split out as its
own endpoint specifically so pages using `SiteHeader` can stay static/ISR
instead of becoming per-request-dynamic just to know if someone's logged
in. `Cache-Control: private, max-age=5, stale-while-revalidate=10`.

### `GET /api/saved-listings/ids`
Auth optional (empty array if none). Returns `{ ids: string[] }` — the
caller's saved-listing IDs from `saved_listings`. Same short private-cache
window as session-summary.

### `POST /api/listings/revalidate`
Auth: any signed-in user (no ownership/ID scoping — it's a blanket cache
purge, not tied to a specific listing). Purges the `"listings"` cache tag
plus `/`, `/[category]`, `/[category]/[slug]`, and `/dashboard` paths. This
exists purely to hang cache invalidation off the listing create/update
flow — see "Where listing writes actually happen" below for why there's no
`POST /api/listings` route. *Note: since any authenticated user can trigger
it, it's a low-value abuse surface (forced cache misses site-wide) but not
a data-integrity issue.*

### `POST /api/listings/images` (`runtime = "nodejs"`)
Auth: Bearer token (preferred — explicitly used during multi-photo batch
uploads to avoid racing the cookie session's refresh token) or fallback
cookie session. Body: `multipart/form-data`, field `file`
(jpeg/png/webp, ≤8MB). Watermarks + resizes (max 1600px, via `sharp`),
computes a perceptual hash + blur score against the *original* buffer
(duplicate/quality detection), uploads to the `listing-images` bucket at
`${user.id}/${uuid}.webp`. Returns `{ path, url, phash, blurScore, width,
height }`. **Writes no DB row** — the client persists `listings`/
`listing_images` rows itself once every photo for an ad has uploaded (see
below).

### `POST` / `DELETE /api/settings/avatar` (`runtime = "nodejs"`)
Auth required. POST: `multipart/form-data` field `file` (≤5MB), resized to
512×512 webp, uploaded to the `avatars` bucket, `profiles.avatar_url`
updated, old avatar file best-effort deleted after (rolls back the just-
uploaded file if the DB update itself fails, to avoid orphaning). DELETE:
clears `avatar_url` and best-effort removes the old file.

### `POST /api/admin/homepage-slides/upload` (`runtime = "nodejs"`)
Auth: admin/super_admin only. `multipart/form-data` field `file` (≤8MB),
cropped/resized to a fixed 1600×480, uploaded to the `homepage-slides`
bucket. Returns `{ path }` — the actual `homepage_slides` row is written
separately by `createSlideAction`/`updateSlideAction` using that path.

### `POST /api/payments/{paystack,flutterwave}/initialize`
Both gated by `PAYMENTS_ENABLED` (404 if off — see INTEGRATIONS.md). Auth
required. Body: `{ planId, listingId? }` (Zod-validated). Calls
`createPendingPurchase()` — validates the plan exists/is enabled, and for
listing-scoped plan types (featured spot, bump) verifies the caller owns
that listing — then inserts `pending` rows into `payments`/`purchases`,
then calls the provider's initialize API. Returns `{ url }` (hosted
checkout link). **Nothing is marked paid here** — only the webhook does
that.

### `POST /api/payments/{paystack,flutterwave}/webhook` (`runtime = "nodejs"`)
Gated by `PAYMENTS_ENABLED`. **Signature verification happens before any
body parsing**, on the raw request body:
- Paystack: `x-paystack-signature` header, HMAC-SHA512 over the raw body
  using `PAYSTACK_SECRET_KEY`, compared with `timingSafeEqual`.
- Flutterwave: `verif-hash` header, a **static shared-secret equality
  check** against `FLUTTERWAVE_SECRET_HASH` (not an HMAC — this is
  Flutterwave's own webhook model, not a Flikax choice), also
  `timingSafeEqual`. Because it's a static value rather than a signature
  over the payload, treat `FLUTTERWAVE_SECRET_HASH` as sensitive as any
  API key — anyone who obtains it can forge webhook events.

On success (`charge.success` / `charge.completed`+`status: successful`),
both call `markPaymentSuccess(reference)`
(`src/lib/payments/mark-payment-success.ts`) — the single place a payment
is ever marked successful, using the **service-role admin client** (no
user session exists on a webhook request). It's idempotent: a reference
already `status: "success"` short-circuits without re-running activation,
so provider retries can't double-extend a plan's expiry.

## Where listing writes actually happen

There is **no `POST /api/listings` route and no `createListingAction`**.
`src/components/listings/listing-form.tsx` writes `listings` and
`listing_images` rows **directly from the browser to Supabase**, relying
entirely on RLS for authorization — not a server action or route handler.
The only server-side touchpoints in that whole flow are the per-photo
`/api/listings/images` upload (above) and the post-save
`/api/listings/revalidate` cache purge. Keep this in mind before assuming
every mutation in this app goes through a server action — this one
deliberately doesn't.

## Category page filter query params (`src/app/[category]/page.tsx`)

Not a Route Handler — `/[category]` reads these directly off `searchParams`
(see `parseAttributeFilters` in `src/lib/category-listings.ts`), but
they're the closest thing this app has to a public filtering "API" and
worth documenting alongside the routes above:

| Param | Values | Notes |
|---|---|---|
| `q` | free text | Title `ilike` search within the category. |
| `location` | district/suburb name | Exact match against `listings.location`. |
| `minPrice` / `maxPrice` | number | Plain price range, independent of the category-specific fields below. |
| `sort` | `recommended` \| `newest` \| `price_asc` \| `price_desc` | Default `recommended`. |
| `posted` | `24h` \| `7d` \| `30d` | Omit for any time. |
| `page` | number | 1-based; stripped from the URL whenever any other filter changes. |
| `verified` | `yes` \| `no` | Sidebar's "Verified sellers" toggle — real `listings.seller_verified` column, not a per-category attribute (see `PSEUDO_FIELD_PARAM`). |
| `discount` | `yes` \| `no` | Sidebar's "Discount" toggle — real `listings.is_discounted` column, same pseudo-field pattern as `verified`. |
| `attr_<fieldKey>` | checklist: comma-joined values; text: one value | `<fieldKey>` is per-category (see `getSidebarFields`/`getTopLevelDisplayFields` in `src/lib/category-filters.ts`) — e.g. `attr_condition=New,Foreign%20Used`, `attr_make=Toyota`. Matches `attributes->><fieldKey>` (or a `cs` contains-check per value for an array field like Key Features). |
| `attr_<fieldKey>_min` / `attr_<fieldKey>_max` | number | Range fields (Year, Mileage, ...) — numeric-cast comparison against `attributes->><fieldKey>`. |

`make`/`brand` are checklist-type fields with no fixed option list (sellers
free-type them) — their checkbox options and per-option ad counts come from
`getChecklistFieldCounts` (real distinct values found in the category's
active listings), not from `listing-fields.ts`. The sidebar's price-bucket
quick-picks (`getPriceBuckets`) are a display/UX convenience only — clicking
one just fills `minPrice`/`maxPrice` client-side, no separate param.

A handful of `make`-quick-filter leaves (currently `buses-microbuses` — see
`getCuratedMakes` in `category-filters.ts`) get a curated top-N `attr_make`
tile row instead of whatever `getTopAttributeValues` finds live, with an
"Other" tile whose `attr_make=Other` link doesn't actually match anything —
clicking it currently 0-results rather than matching "every make not in the
curated list." Add a real catch-all query mode if this needs to be clickable
later (`attr_make=Other` is display-only for now).

On a top-level category page (e.g. `/vehicles`), the same top tile row
instead links straight to each subcategory (`/cars`, `/buses-microbuses`,
...) rather than filtering the current page — no `attr_` param involved
there at all.

## Server Actions

Grouped by area. Every `src/app/admin/**/actions.ts` file gates on
`requireAdminActor()`/`requireSuperAdminActor()` at the top of each
exported action (noted per-group below), and most admin mutations also
call `logAdminAction()` (writes `admin_audit_log`) and finish with
`revalidatePath`/`revalidateTag`.

### Public listing browsing — `src/app/actions.ts`, `src/app/[category]/actions.ts`
- `loadMoreHomeListingsAction(filters, page)` / `loadMoreCategoryListingsAction(filter, page)` — no auth (public data), deliberately uncached, power infinite-scroll on the homepage/category grid.

### Listings (owner-facing) — `src/app/listings/actions.ts`
- `toggleSavedListingAction(listingId)` — auth required, toggles `saved_listings`.
- `markListingUnavailableAction(listingId)` — sets `status = "removed"`, scoped by `.eq("user_id", user.id)` on the query itself (silent no-op if you don't own it — fails closed rather than branching on an explicit ownership check).
- `submitReportAction(listingId, reason)` — inserts into `reports`; a duplicate-report unique-constraint violation is turned into a friendly message.

### `src/app/my-adverts/actions.ts`
- `deleteListingAction(formData: FormData)` — bound to a raw `<form action={...}>` (Next's form-binding convention, hence untyped `FormData` rather than typed args). Same ownership-via-query-scope pattern as `markListingUnavailableAction`.

### Messaging — `src/app/messages/actions.ts`
- `getOrCreateConversationIdAction(listingId, currentPath)` / legacy `startOrGetConversationAction` — finds-or-creates a `conversations` row (handles the insert race via re-querying on a unique-violation), blocks messaging yourself about your own listing.
- `revealPhoneAction(conversationId)` → RPC `reveal_phone`.
- `markConversationReadAction(conversationId)` → RPC `mark_conversation_read`.

### Feedback (seller reviews) — `src/app/u/actions.ts`
- `submitFeedbackAction(profileId, sentiment, message)` — blocks self-feedback.
- `reportFeedbackAction(feedbackId, reason)` — duplicate-report violation → friendly message.
- `replyToFeedbackAction(feedbackId, profileId, message)`.

### Account/settings — `src/app/settings/actions.ts`
- `deleteAccountAction()` — auth required, uses the service-role admin client (`auth.admin.deleteUser`), returns a friendly error rather than throwing if `SUPABASE_SERVICE_ROLE_KEY` isn't configured, signs out on success.

### Contact form — `src/app/contact/actions.ts`
- `submitSupportTicketAction({name, email, topic, message})` — **no auth required** (public form); attaches `user_id` if signed in. Server-side field validation returns `{ error }` rather than throwing.

### Admin — categories (`src/app/admin/categories/actions.ts`, super_admin only)
`createCategoryAction`, `updateCategoryAction`, `reorderCategoryAction`,
`deleteCategoryAction` — enforces the 2-level-max nesting rule at the app
layer (`assertShallowParent()`, no DB constraint backs it);
`deleteCategoryAction` blocks deletion while listings/subcategories still
reference the category; unique-slug violations get a friendly message.

### Admin — listings (`src/app/admin/listings/actions.ts`, admin or super_admin)
`updateListingStatusAction`, `deleteListingsAction`,
`updateListingCategoryAction`, `extendListingExpiryAction`,
`clearFeaturedAction`, `clearBumpAction`. The latter two are also reused by
`revokePurchaseAction` (payments actions) to undo a plan's effect when a
purchase is revoked — logic isn't duplicated between the two areas.

### Admin — moderation (`src/app/admin/moderation/actions.ts`, admin or super_admin)
`updateModerationFlagStatusAction(ids, status)` — rejecting a flag also
calls `updateListingStatusAction` to remove the underlying listing.

### Admin — reports (`src/app/admin/reports/actions.ts`, admin or super_admin)
`updateReportStatusAction`, `toggleReportPriorityAction`,
`warnSellerForReportAction` (composes the users-area `logWarningAction`),
`suspendSellerForReportAction` (composes `suspendUserAction`),
`deleteListingForReportAction` (composes `deleteListingsAction`) — this
whole file is mostly thin composition over the listings/users action
modules rather than duplicated logic.

### Admin — reviews/feedback moderation (`src/app/admin/reviews/actions.ts`, admin or super_admin)
`updateFeedbackReportStatusAction`, `deleteFeedbackAction`,
`warnFeedbackAuthorAction` (composes `logWarningAction`).

### Admin — users (`src/app/admin/users/actions.ts`, admin or super_admin, service-role client)
`suspendUserAction`, `restoreUserAction`, `banUserAction`/`unbanUserAction`
(via `auth.admin.updateUserById`, "permanent" ban = `"876000h"` since the
Admin API has no true-infinite value), `deleteUserAction`,
`toggleVerifiedAction`, `logWarningAction` (writes
`admin_user_warnings`, reused by reports/reviews). Self-suspend/self-ban/
self-delete are all explicitly blocked.

### Admin — payments (`src/app/admin/payments/actions.ts`, admin or super_admin, service-role client — `purchases`/`payments` have no admin-level RLS policy)
`markPurchaseActiveAction(purchaseId)` — manual fix for "the webhook never
arrived," calls the same `markPaymentSuccess()` the real webhooks use.
`revokePurchaseAction(purchaseId)` — cancels the purchase and reverses its
listing effect via `clearFeaturedAction`/`clearBumpAction`.

### Admin — premium plans (`src/app/admin/premium-plans/actions.ts`, super_admin only)
`createPlanAction`, `updatePlanAction`, `togglePlanEnabledAction`,
`deletePlanAction` — each revalidates both `/admin/premium-plans` and the
public `/premium` pricing page.

### Admin — homepage slider (`src/app/admin/homepage-slider/actions.ts`, admin or super_admin)
`createSlideAction`, `updateSlideAction`, `deleteSlideAction` (also removes
the Storage object), `toggleSlideActiveAction`, `reorderSlideAction`.

### Admin — locations (`src/app/admin/locations/actions.ts`, super_admin only)
Name edits (district rename cascades to its suburbs' denormalized district
name), `toggleLocationEnabledAction`, reorder actions (swap-based),
`deleteLocationAction` (blocks deleting a district with suburbs still
under it, or any location still referenced by a listing).

### Admin — settings/flags (`src/app/admin/settings/actions.ts`, super_admin only)
`toggleFeatureFlagAction(key, enabled)` — this is what flips
`maintenance_mode`, the flag the root middleware polls every request.
`updateSiteSettingAction(key, value)`.

### Admin — support/admins (`src/app/admin/support/actions.ts`, `src/app/admin/admins/actions.ts`)
`updateTicketStatusAction` (admin or super_admin). `updateAdminRoleAction`
/ `grantAdminAccessAction` (super_admin only) — self-demotion is blocked;
granting access requires the target phone number to already belong to a
signed-up user (looked up via `profiles.phone`).

## Security notes worth knowing before you touch any of this

- **Webhook signature verification is correctly ordered** in both payment
  webhook routes — the signature check strictly precedes any body-parsing
  or trust of the payload, and both use `timingSafeEqual`. This is the
  highest-stakes trust boundary in the app; if you ever touch these files,
  preserve that ordering.
- **Ownership-by-query-scope, not explicit branching**: a few actions
  (`markListingUnavailableAction`, `deleteListingAction`) enforce ownership
  by baking `.eq("user_id", user.id)` directly into the mutating query
  rather than checking-then-branching — an unauthorized call just silently
  affects 0 rows rather than surfacing an explicit error. This is safe but
  produces no feedback to a caller passing someone else's ID; it's an
  intentional pattern in this codebase, not a bug, but worth knowing before
  you "fix" it into an explicit check that changes the error UX.
- **`/api/listings/revalidate`** requires only "is signed in," no
  resource-level scoping — see its entry above.
- No rate limiting exists on any route handler or server action beyond
  incidental DB unique-constraint dedup on a handful of them (e.g. the
  duplicate-report checks). Worth knowing if abuse-resistance is ever a
  concern for public-facing endpoints like the contact form or report
  actions.
