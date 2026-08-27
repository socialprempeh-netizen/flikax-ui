# Flikax

Flikax is a classifieds marketplace for Ghana — buy and sell vehicles, phones,
property, electronics, fashion, and more. Users browse and search listings by
category and location, message sellers, and (once payments are switched on)
pay for featured/bumped placement.

The actual application lives in **[`artifacts/flikax/`](artifacts/flikax/)**
— that's the directory you `cd` into for everything below. The repository
root is a [pnpm workspace](https://pnpm.io/workspaces) that also contains a
couple of unrelated/experimental packages (`artifacts/api-server`,
`artifacts/mockup-sandbox`, the root-level `lib/*` folders); Flikax does not
depend on any of them at runtime, so you can safely ignore them.

## Tech stack

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router, React 19,
  TypeScript), deployed on [Vercel](https://vercel.com/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) +
  [shadcn/ui](https://ui.shadcn.com/) primitives (Radix under the hood)
- **Backend/DB:** [Supabase](https://supabase.com/) — Postgres, Auth
  (email/phone/OTP + Google/Facebook OAuth), Storage (listing photos), and
  Realtime (chat)
- **Payments:** [Paystack](https://paystack.com/) and
  [Flutterwave](https://flutterwave.com/) (built end-to-end, currently gated
  off — see [Environment variables](#environment-variables))
- **Other notable libraries:** `@supabase/ssr` (cookie-based session
  handling), `framer-motion` (page/card transitions), `sharp` (server-side
  image watermarking), `recharts` (admin analytics)
- **Package manager:** [pnpm](https://pnpm.io/) (workspace-aware — always
  install from the repo root, not from inside `artifacts/flikax/`)

## Running it locally

Requires **Node.js 24** and **pnpm** (`corepack enable` if you don't have
pnpm yet).

```bash
# From the repo root — installs for every workspace package, not just Flikax
pnpm install

# Then run the app itself from its own directory
cd artifacts/flikax
cp .env.local.example .env.local   # fill in the values, see below
pnpm dev                           # http://localhost:3000
```

Other useful commands (run from `artifacts/flikax/`):

| Command | What it does |
|---|---|
| `pnpm dev` | Start the dev server (hot reload) |
| `pnpm build` | Production build |
| `pnpm start` | Run a production build locally (run `build` first) |
| `pnpm lint` | ESLint |
| `npx tsc --noEmit` | Type-check without emitting output |
| `npx tsx scripts/backfill-watermarks.ts --dry-run` | One-off maintenance script — see its own header comment before running for real |

There is no local test suite at the time of writing (see `BUGS_AND_TODO.md`).

## Environment variables

Create `artifacts/flikax/.env.local` (never committed — see `.gitignore`).
There's a fully-commented template in
[`artifacts/flikax/.env.example`](artifacts/flikax/.env.example); the table
below is the same information at a glance.

| Variable | Required? | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | Your Supabase project URL. Public — exposed to the browser. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Yes** | Supabase anon/public API key. Public — exposed to the browser, relies on Postgres RLS for actual security. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only | Bypasses RLS. Currently only used for "Delete my account permanently" in Settings. **Never** expose this to the client or commit a real value. Get it from Supabase Dashboard → Project Settings → API. |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Used to build absolute URLs in `robots.txt`/`sitemap.xml`. Falls back to `http://localhost:3000` in dev if unset. |
| `PAYMENTS_ENABLED` | No (default `false`) | Master kill switch for Paystack/Flutterwave and the paid Featured-listing tier. Leave `false`/unset until both providers' keys are real and their webhooks are verified — see `BUGS_AND_TODO.md`. |
| `PAYSTACK_SECRET_KEY` | Server-only, only if payments enabled | From the Paystack dashboard → Settings → API Keys & Webhooks. |
| `FLUTTERWAVE_SECRET_KEY` | Server-only, only if payments enabled | From the Flutterwave dashboard → Settings → API Keys. |
| `FLUTTERWAVE_SECRET_HASH` | Server-only, only if payments enabled | An arbitrary string *you* choose and also enter in the Flutterwave dashboard's webhook settings — not provider-generated. |

Anything prefixed `NEXT_PUBLIC_` is bundled into client-side JS — never put a
secret there. Everything else is server-only by default in Next.js.

## Database

Supabase is the source of truth for schema (managed via the Supabase
dashboard/CLI, not an ORM in this codebase). A handful of SQL migrations that
were applied manually and are worth keeping in version control live in
[`artifacts/flikax/supabase/migrations/`](artifacts/flikax/supabase/migrations/)
— apply new ones the same way (Supabase Studio's SQL editor, or the Supabase
CLI). `src/lib/supabase/database.types.ts` is generated from the live schema
via `supabase gen types typescript`; regenerate it after any schema change
rather than hand-editing it.

## Where things live

```
artifacts/flikax/
  src/
    app/            Next.js App Router — every route/page/layout/server action,
                     plus /api/* route handlers (payments webhooks, uploads, etc.)
    components/      Shared UI, grouped by feature (auth/, listings/, admin/,
                     messages/, premium/, settings/, dashboard/, ...);
                     components/ui/ holds the shadcn primitives
    lib/            Framework-agnostic helpers, data access, and business logic
      supabase/      The three Supabase client factories (browser/server/admin)
                     — see that folder's own comments for when to use which
      payments/      Paystack/Flutterwave integration logic
      admin/         Data-fetching + filter-parsing helpers for the /admin/* pages
    middleware.ts    Session refresh + route gating (runs on every request)
  supabase/
    migrations/      Hand-tracked SQL migrations (see Database, above)
  scripts/           One-off maintenance scripts (not part of the running app)
```

Routing, data-fetching, and Supabase access are already cleanly separated
along the lines above — a new feature almost always means adding one file
per layer (a route in `app/`, a component in `components/`, a helper in
`lib/`) rather than restructuring anything.

## Deployment

The app is deployed on Vercel (project linked via `.vercel/project.json`;
`vercel.json`/`.vercel` are gitignored, so re-link with `vercel link` if you
need the CLI locally). Pushing to `main` triggers a production deployment
automatically via Vercel's GitHub integration. Remember to add every
environment variable above to the Vercel project's own env settings — it
does not read `.env.local`.

## Documentation

Deeper reference docs live alongside the app in `artifacts/flikax/`:

- **[ARCHITECTURE.md](artifacts/flikax/ARCHITECTURE.md)** — how the app is
  put together: rendering model, the Supabase client layer (which of the
  five client factories to use where), root middleware, the category
  system (including the `/[category]` page's sidebar filters/quick-filter
  tiles/results-grid component breakdown), and other cross-cutting
  patterns.
- **[DATABASE.md](artifacts/flikax/DATABASE.md)** — every table, column,
  index, RPC, and Storage bucket, reconstructed from migrations +
  generated types (with an important caveat about what isn't committed to
  this repo — read the top of that doc before trusting it blindly).
- **[API.md](artifacts/flikax/API.md)** — every Route Handler and Server
  Action: what it does, what it expects, auth requirements.
- **[DESIGN_SYSTEM.md](artifacts/flikax/DESIGN_SYSTEM.md)** — color/type/
  spacing tokens and the standing UI rules (square corners, visible
  dividers, icon conventions) new work is expected to follow.
- **[INTEGRATIONS.md](artifacts/flikax/INTEGRATIONS.md)** — every
  third-party service (Supabase, Paystack, Flutterwave, Resend/SMTP,
  Vercel), exactly which env vars each needs, and what's actually
  configured today vs. what's declared-but-unset.

## Where to start

See **[`BUGS_AND_TODO.md`](BUGS_AND_TODO.md)** for a punch-list of known
rough edges, missing polish, and things that were intentionally deferred.
