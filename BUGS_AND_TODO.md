# Bugs & TODO

A punch-list for whoever picks this up next — known rough edges, deferred
work, and things worth double-checking before a real production launch.
Nothing here is a "must fix before it runs"; the app builds and works. This
is the "here's what we already know about" list so you don't have to
rediscover it.

## Real gaps (missing features, not just polish)

- **No avatar upload.** `profiles.avatar_url` is read everywhere (header,
  dashboard sidebar, messages) and every avatar component has an
  initials/icon fallback for when it's null — but there is no UI anywhere in
  Settings to actually upload/set one. Whoever builds this should follow the
  existing listing-photo upload pipeline (`src/app/api/listings/images/`) as
  the reference pattern (Storage bucket + watermark/resize step).
- **No way to "un-remove" a listing.** `MarkUnavailableButton` sets a
  listing's status to `removed`, but nothing in the app — not the seller's
  dashboard, not the admin panel — ever sets it back to `active`. Right now
  that action is effectively permanent even though the button's copy
  ("Mark unavailable") implies it isn't. Either add a "relist" action or
  reword the button/confirmation to make the permanence clear.
- **`/dashboard/balance` (GHC Balance) is a placeholder.** No wallet/balance
  table exists yet; the page just renders a "coming soon" card. Same for
  several other `/dashboard/*` sub-pages (`offers`, `referral`, `safety`,
  `saved-alerts`, `verified-badge`, `ad-sharing`, `disable-chats`,
  `disable-feedback`, `business`) — check each before assuming it's live.
- **Payments are fully wired but intentionally off.** `PAYMENTS_ENABLED=false`
  gates both Paystack and Flutterwave checkout server-side, and
  `featured_tier_enabled` (a DB feature flag) separately gates whether
  `/premium` shows real plans or a placeholder. Both need to be flipped on
  — and both providers' webhook URLs verified in their dashboards — before
  a real purchase can complete. See `src/lib/payments/config.ts`.
- **Dead code:** `src/components/listings/start-chat-button.tsx`
  (`StartChatButton`) has zero import sites. It was superseded by
  `ChatPopupButton` (see that file's own comment) but never deleted. Safe to
  remove once confirmed the full-page chat flow it implements isn't wanted
  back.

## Known limitations / things to verify with real hardware

- **Mobile keyboard-avoidance for the chat input** (`ChatThread` inside both
  the Messages modal and the ad-detail chat popup) was implemented with a
  `window.visualViewport`-driven height, verified by shrinking a headless
  browser's viewport to simulate a keyboard opening. A **headless browser
  cannot render a literal OS on-screen keyboard**, so this hasn't been
  confirmed on a real phone. Worth 5 minutes of manual QA on an actual
  iPhone and Android device before launch, especially in any in-app
  webview (Facebook/Instagram browser) — those have historically had the
  buggiest `dvh`/`visualViewport` support.
- **No automated test suite.** There's no Jest/Vitest/Playwright test
  config anywhere in `artifacts/flikax`. All verification in this repo's
  history has been manual/agent-driven browser screenshots. Worth adding
  at least a smoke-test suite (auth, post-a-listing, checkout) before
  the app gets much bigger.

## UI polish scoped narrower than "everywhere"

A recent pass added section dividers, tightened heading type, fixed image
aspect ratios, and general visual polish — but it was deliberately scoped to
the **homepage and the shared header/footer/listing-grid/detail-gallery
chrome** that every page reuses, not literally every page in the app.
Pages that haven't had the same pass and may still look "raw" by comparison:

- Admin pages (`/admin/**`) — functional, not visually polished; not a
  public-facing surface, so lower priority, but worth a pass before handing
  the admin panel to non-technical staff.
- Most `/dashboard/**`, `/settings/**` sub-pages beyond the ones actively
  touched during recent chat/message work.
- Category listing pages (`/[category]`) have their own sidebar filter
  panel (`CategorySidebarFilters`) and sibling-category row that weren't
  part of the homepage's Filters-button removal or category-reorder work —
  double check they still feel consistent with the homepage now that the
  homepage's filter bar changed shape.

## Housekeeping

- **`replit.md`** at the repo root is unfilled Replit scaffolding
  boilerplate for a *different* stack (Express + Drizzle + Postgres) — it
  doesn't describe Flikax at all and was likely never updated after the
  workspace template was generated. Either fill it in properly or delete it;
  right now it's actively misleading if someone assumes it's current.
- **`.migration-backup/`** (~5.3 MB, gitignored) is described in its own
  `.gitignore` entry as "a superseded pre-workspace snapshot, kept on disk
  for reference only." If nobody's referenced it in a while, it's safe to
  delete — it's not part of the deployed app and isn't tracked in git
  anyway.
- **Dark mode CSS exists but isn't wired up.** `globals.css` has a full
  `.dark` variable set, but nothing ever applies that class (see the
  `ThemeProvider` in `layout.tsx`, `defaultTheme: "light"`) and most
  components hardcode `bg-white`/`neutral-*` rather than theme tokens.
  Turning on a theme toggle today would produce a half-dark, half-light UI.
  Treat the `.dark` block as a starting point, not a finished feature.
- **The four `/auth/*` pages** (`login`, `register`, `forgot-password`,
  `reset-password`) each duplicate the same gradient-card page wrapper
  markup independently rather than sharing an `auth/layout.tsx`. Low-risk
  DRY-up if you're ever touching that visual treatment.
- **A gotcha worth knowing before you touch mobile "edge-to-edge" layouts
  again:** don't pair a negative-margin breakout (`-mx-4 sm:mx-0`) with an
  explicit width utility (`w-full`) on the same element. CSS treats
  margin-left + width + margin-right as over-constrained when all three are
  specified, and silently discards the specified `margin-right` to
  rebalance — so only the left edge reaches the screen edge. Omit the width
  utility and let it resolve from the margin equation instead (see
  `ListingGrid` and `ListingGallery` for the working pattern). This bit us
  twice in this codebase already.

## Recently addressed (context, not action items)

For history — these came up repeatedly during recent UI work and are now
resolved, listed here so nobody "re-discovers" and re-fixes them:

- Listing grid cards and the ad-detail hero gallery are both confirmed
  edge-to-edge with zero border-radius on mobile, verified against a real
  WebKit (Safari) engine with exact pixel measurements, not just Chromium.
- Every product/listing photo, avatar, and category thumbnail in the
  codebase already pairs a fixed/enforced aspect-ratio container with
  `object-cover` (audited file-by-file — see git history around the
  "handover prep" commits for the full list).
- `src/lib/admin-*.ts` (19 flat files) were moved into `src/lib/admin/`
  with the redundant `admin-` prefix dropped from each filename; all 45
  importing files were updated to match. Verified with a full `tsc` and
  `next build`.
