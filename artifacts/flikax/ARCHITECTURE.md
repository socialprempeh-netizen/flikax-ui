# Architecture

A map of how Flikax is put together — for a developer who's never seen this
codebase before. Companion docs: [DATABASE.md](./DATABASE.md) (schema),
[API.md](./API.md) (routes/actions), [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)
(tokens/components), [INTEGRATIONS.md](./INTEGRATIONS.md) (third-party
services).

## What this is

Flikax is a Ghana-focused classifieds marketplace (buy/sell listings across
vehicles, property, electronics, fashion, and more) — a Next.js App Router
app backed by Supabase (Postgres + Auth + Storage), deployed on Vercel.

This directory (`artifacts/flikax`) is one package in a larger pnpm
workspace (see the repo root's `pnpm-workspace.yaml`); the other workspace
members (`artifacts/api-server`, `lib/*`) are not part of the deployed app —
check with whoever's driving the project before assuming they're live.

## Tech stack

- **Framework**: Next.js 15 (App Router), React 19, TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 (CSS-first config via `@theme` in
  `globals.css`, not a `tailwind.config.ts`), shadcn/ui (`new-york` style,
  `neutral` base) for primitive components in `src/components/ui/`
- **Backend**: Supabase — Postgres (with Row Level Security), Auth, Storage.
  No custom backend server; all data access is either a Supabase client call
  from a Server Component/Server Action, or a Next.js Route Handler.
- **Payments**: Paystack and Flutterwave, both wired but gated off by
  default (see [INTEGRATIONS.md](./INTEGRATIONS.md))
- **Deployment**: Vercel. `getSiteUrl()` (`src/lib/site-url.ts`) resolves the
  canonical site origin from `NEXT_PUBLIC_SITE_URL`, falling back to
  Vercel's auto-populated `VERCEL_PROJECT_PRODUCTION_URL`, then localhost.
- **Image processing**: `sharp` (server-side watermarking on upload; also
  what Next's built-in image optimizer uses under the hood)

## Directory layout

```
src/
  app/                  Next.js App Router routes (see below)
    api/                Route Handlers (REST-ish JSON endpoints)
    [category]/         Dynamic category + listing-detail routes
    admin/               Admin panel (own layout, own auth gate)
    auth/                Login/register/forgot-password/reset-password
    dashboard/            Seller's own account area (own layout)
    settings/             Account settings (own layout)
    ...                   One directory per top-level route
  components/
    ui/                 shadcn/ui primitives (Button, Card, Dialog, ...)
    admin/              Admin-panel-only components
    listings/           Listing form, gallery, chat-popup, save button, ...
    auth/, settings/, messages/, feedback/, ...  Feature-scoped components
    icons/              Hand-built brand icon SVGs (social icons, etc.)
    seo/                JSON-LD helper
    <top-level>.tsx     Shared chrome used by most pages (site-header.tsx,
                         site-footer.tsx, listing-grid.tsx, category-*.tsx,
                         location-picker-modal.tsx, category-picker-modal.tsx)
  lib/
    supabase/           Client factories -- see "Supabase client layer" below
    admin/              Admin-only data-access + filter-parsing helpers
    payments/           Paystack/Flutterwave clients, shared config/schemas
    <domain>.ts         One file per domain concept (categories.ts,
                         listing-fields.ts, locations.ts, premium-plans.ts,
                         messages.ts, feedback-report-reasons.ts, ...)
supabase/
  migrations/           SQL migrations, applied in filename order -- see
                         DATABASE.md for the schema they produce
```

Path alias: `@/*` resolves to `src/*` (see `tsconfig.json`).

## Rendering model

Almost every page is a Server Component by default (the standard App Router
posture) — data fetching happens directly in `page.tsx`/`layout.tsx` via a
server-side Supabase client, no client-side `useEffect` fetch waterfalls for
initial page content. `"use client"` is reserved for genuinely interactive
pieces (forms, modals, anything with local state or event handlers) — e.g.
`ListingForm`, `LocationPickerModal`, `CategoryPickerModal`, chat UI.

`src/app/template.tsx` wraps every page in a `framer-motion` fade+rise
entrance animation. Unlike `layout.tsx` (which persists across navigations),
Next.js remounts `template.tsx` on every navigation, which is what makes it
the right hook for a per-page-load transition.

Mutations go through either:
- **Server Actions** (`"use server"` functions, typically in a page's own
  `actions.ts`) — the default for form submissions and admin operations.
- **Route Handlers** (`src/app/api/**/route.ts`) — used where a real HTTP
  endpoint is needed (webhooks, file uploads, anything called from outside
  a form's natural submit flow). See [API.md](./API.md) for the full list.

## Supabase client layer (`src/lib/supabase/`)

Four different client factories, each for a different execution context —
using the wrong one is the most common way to break auth in this codebase:

- **`client.ts`** — browser client (`"use client"` components only). Reads
  the session from cookies via `@supabase/ssr`.
- **`server.ts`** — server client for Server Components/Server
  Actions/Route Handlers. Also exports `getUser()`, a memoized wrapper
  around `supabase.auth.getUser()` so a single request doesn't re-validate
  the session token multiple times across nested components.
- **`admin.ts`** — service-role client (`createAdminClient()`), bypasses
  Row Level Security entirely. Used only for admin-panel operations that
  legitimately need to read/write across all users' data (e.g. reading
  another user's `purchases` row, which has no RLS policy granting that to
  a plain "admin" role — only `super_admin`, and some tables have none at
  all). Never use this for anything a normal authenticated user's own RLS
  policies should already cover.
- **`public.ts`** — anonymous/public client (`createPublicClient()`), for
  data that's readable without a session at all (e.g. public listing pages)
  where you don't want to pay the cost of resolving/refreshing a session
  that isn't needed.
- **`middleware.ts`** — `updateSession()`, called from the root
  `src/middleware.ts` on most requests to refresh the Supabase session
  cookie so Server Components see a valid, non-stale user. Deliberately
  skipped for Server Action POSTs and Next's own `<Link>` prefetch requests
  (see the extensive comment in `src/middleware.ts`) — running it on those
  too caused a real, previously-shipped bug where concurrent requests raced
  to rotate the same single-use refresh token and randomly logged users out.

## Root middleware (`src/middleware.ts`)

Two jobs on (almost) every request:
1. Redirect the entire site to `/maintenance` when the `maintenance_mode`
   feature flag (a row in the `feature_flags` table, see DATABASE.md) is on
   — checked via a direct cached REST call, not the full SSR client, since
   this runs on every request and the flag is public-readable.
2. Delegate to `updateSession()` for auth cookie refresh (see above).

## The category system

Every category in the app is **exactly two levels deep** — a top-level
category (`parent_id IS NULL`, e.g. "Vehicles") and its leaf subcategories
(e.g. "Cars", "Motorcycles & Scooters"). No leaf category ever has children
of its own; this invariant is relied on throughout the app (e.g.
`CategoryPickerModal` only ever needs one level of drill-down).

- `src/lib/categories.ts` / `category-listings.ts` / `category-filters.ts` —
  category tree queries, per-category listing counts, and the sidebar
  filter field definitions per category.
- `src/lib/listing-fields.ts` — declares the dynamic attribute fields each
  category's post-ad form and spec display use (condition, brand, storage,
  etc.) — this is what makes one generic `ListingForm` component work for
  every category without a hardcoded field list per category.
- `src/lib/category-icons.ts` / `category-colors.ts` / `category-images.ts`
  — per-category-slug icon (Lucide component), accent color, and optional
  real photo, resolved through `CategoryThumb` everywhere a category
  renders as a small badge/thumbnail.

### `/[category]` page component structure

`src/app/[category]/page.tsx` (and the location-scoped branch of
`src/app/[category]/[slug]/page.tsx`) composes the same set of
components for both a top-level category and a leaf:

- `CategoryQuickFilters` (`src/components/category-quick-filters.tsx`) —
  the icon tile row just above the results (e.g. Vehicle Parts &
  Accessories' Type row: Exterior Accessories, Engine & Drivetrain, ...).
  Driven by `getQuickFilterKey`/`getQuickFilterStyle`
  (`category-filters.ts`) and populated with real values + counts from
  `getTopAttributeValues`. Fixed tile sizing (110×124px desktop, 75px
  mobile) matches the reference marketplace layout this was built
  against; brand color and square corners stay Flikax's own.
- `CategorySidebarFilters` (`src/components/category-sidebar-filters.tsx`)
  — the left filter column: Location, a "Price Range" `FilterFolder` (plain
  Min/Max + an optional quartile price-bucket quick-pick list from
  `getPriceBuckets`), then one `FilterFolder` per `SidebarFilterField`
  (`category-filters.ts`) — range/checklist/toggle/text depending on the
  field's underlying `listing-fields.ts` type. Checklist options show a
  real per-option ad count when `fieldCounts` (from
  `getChecklistFieldCounts`) has one. Desktop renders as a sticky
  256px→280px card; mobile is the same `body` JSX reused inside a
  full-screen sheet behind a floating "Filters" button.
- `ListingGrid`/`InfiniteListingGrid` (`src/components/listing-grid.tsx`,
  `infinite-listing-grid.tsx`) — the results themselves. Deliberately a
  Jiji-style CSS-multi-column masonry grid (variable card height off each
  image's real aspect ratio), shared with the homepage — see that file's
  own comments for why a fixed-aspect 2-column list layout was
  intentionally *not* adopted here despite it being a common competitor
  pattern.

## Listings: attributes and images

A listing's category-specific data (make/model/year for a car, bedroom
count for property, etc.) lives in a single `attributes` JSONB column
rather than category-specific tables — the field *names* and *types* for a
given category come from `listing-fields.ts`, not from the schema. See
DATABASE.md for the `listings` table shape.

Photos are uploaded through `src/app/api/listings/images/route.ts`, which
watermarks (via `sharp`, see `src/lib/watermark.ts`) and perceptually
hashes (`src/lib/image-hash.ts`, for duplicate detection) each image before
storing it in the `listing-images` Storage bucket.

## Admin panel

`src/app/admin/layout.tsx` gates the entire `/admin/*` tree behind
`requireAdmin()` (`src/lib/admin/auth.ts`) and wraps it in `AdminShell`
(`src/components/admin/admin-shell.tsx`), which provides the sidebar nav,
breadcrumb header, and the `<main>` landmark every admin page renders into.
A non-admin (or logged-out) visitor hitting `/admin/*` is bounced to the
homepage exactly like any unknown route — no "access denied" page, so the
existence of the admin panel isn't confirmed to anyone probing for it.

Admin data-access/filter-parsing logic lives in `src/lib/admin/*.ts`, one
file per admin feature area (listings, users, moderation, payments, reports,
reviews, support, analytics, audit log).

## Payments

Both Paystack and Flutterwave are fully implemented (`src/lib/payments/`)
but intentionally gated off by a `PAYMENTS_ENABLED` env flag plus a
`featured_tier_enabled` DB feature flag — see
[INTEGRATIONS.md](./INTEGRATIONS.md) for exactly what flipping them on
requires.

## Known architectural notes worth knowing before you touch things

- **No automated test suite.** Verification in this codebase's history has
  been manual/agent-driven (real builds, live page fetches, Lighthouse/axe
  audits) rather than a Jest/Vitest/Playwright suite.
- **Dark mode CSS exists but isn't wired up** — see DESIGN_SYSTEM.md.
- **`src/app/[category]/[slug]/page.tsx`** is one file handling three
  distinct route shapes (a real listing detail page, a
  category-scoped-to-location page, and legacy short-ID redirects) — read
  its own top-of-file comments before assuming `[slug]` always means "a
  listing."
- See `BUGS_AND_TODO.md` at the repo root for a maintained list of known
  gaps, placeholders, and deferred work that isn't repeated here.
