# Database

Schema reference for Flikax's Supabase (Postgres) database. Companion to
[ARCHITECTURE.md](./ARCHITECTURE.md) and [API.md](./API.md).

## Important caveat before you trust anything below

`supabase/migrations/` is **not the source of the base schema**. It only
contains 5 migration files (`homepage_slides.sql`, `perf_indexes.sql`,
`top_sellers_rpc.sql`, `add_profile_bio.sql`, `add_profile_avatar.sql`) —
none of which `CREATE TABLE`s any of `profiles`, `listings`, `categories`,
`conversations`, `messages`, or most other tables. Those were created
directly against the live Supabase project (dashboard or `supabase db push`
without ever committing the originating SQL) before this repo's migration
history started.

What that means practically:
- **Column names/types/nullability below are trustworthy** — they're read
  from `src/lib/supabase/database.types.ts`, which is generated from the
  live database, so it reflects real current shape.
- **Primary keys are assumed, not proven.** Every table below uses `id` as
  its apparent primary key by convention (`feature_flags` and
  `site_settings` are the two exceptions — they key on `key` instead) but
  no `CREATE TABLE`/`PRIMARY KEY` DDL exists in-repo to confirm it.
- **RLS policies are almost entirely undocumented in-repo.** Only
  `homepage_slides` and the three Storage buckets have their actual
  `CREATE POLICY` SQL committed (see below). Every other table's RLS is
  real and load-bearing (e.g. `listings.contact_phone` is genuinely
  inaccessible to a normal client — see below) but its policy definitions
  live only on the Supabase dashboard. **If you need to change access
  rules on any table other than the ones below, check the live dashboard
  first — don't assume a migration file describes current reality.**
- If you're setting up a fresh Supabase project from scratch, running just
  `supabase/migrations/*.sql` will **not** reproduce this schema. You'd
  need to either pull the live schema (`supabase db pull`) or reconstruct
  the base tables by hand from this document.

## Tables

### `profiles`
One row per Supabase Auth user (`id` is the same UUID as `auth.users.id` —
no default, populated at signup, not DB-generated).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK, = `auth.users.id` |
| `full_name` | text \| null | |
| `phone` | text \| null | Unique at the Auth level (enforced by Supabase Auth itself at signup, not a `public.profiles` constraint) |
| `date_of_birth` | date \| null | |
| `sex` | text \| null | |
| `location` | text \| null | |
| `role` | text \| null | `admin` \| `super_admin` \| `null` (ordinary user) — see `src/lib/admin/auth.ts` |
| `verified` | bool | default `false` |
| `suspended_until` | timestamptz \| null | compared against `now()` in app code, not a separate boolean |
| `notify_new_call` / `notify_new_message` | bool | defaults |
| `bio` | text \| null | **`profiles_bio_length` CHECK**: `bio IS NULL OR char_length(bio) <= 500` |
| `avatar_url` | text \| null | Storage path in the `avatars` bucket |
| `created_at` / `updated_at` | timestamptz | |

Note: `auth.users.banned_until` (Supabase Auth/GoTrue's own column, not in
`public.profiles`) is the real ban signal the admin panel checks — don't
confuse it with a `profiles` column.

### `categories`
Exactly two levels deep sitewide (see ARCHITECTURE.md) — enforced only at
the app layer (`assertShallowParent()` in
`src/app/admin/categories/actions.ts`), not by a DB constraint.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `name` | text | |
| `slug` | text | unique (`categories_slug_key`) |
| `parent_id` | uuid \| null | self-FK → `categories.id`; `null` = top-level |
| `icon` | text \| null | admin-overridable icon name, see DESIGN_SYSTEM.md |
| `display_order` | int | |
| `created_at` | timestamptz | |

### `listings`
The core table. Category-specific fields (make/model/year, bedrooms, etc.)
live in `attributes` (JSONB), not as dedicated columns — the field
names/types per category come from `src/lib/listing-fields.ts`, not schema.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `short_id` | bigint | **server-generated** (`never` in the TS Insert/Update types — clients can't set it); unique (`listings_short_id_idx`); used for short URLs/legacy redirects |
| `user_id` | uuid | FK → `profiles.id` |
| `category_id` | uuid | FK → `categories.id` |
| `title` | text | |
| `description` | text \| null | |
| `price` | numeric | |
| `original_price` | numeric \| null | for showing a struck-through "was" price |
| `is_discounted` | bool \| null | |
| `negotiable` | text \| null | app checks `=== "yes"` |
| `location` | text | free text matching `locations.district_slug`/region name — **not FK-enforced** |
| `attributes` | Json | category-specific spec fields, see `src/lib/listing-fields.ts` |
| `status` | text | `active` \| `pending` \| `declined` \| `removed` \| `sold` |
| `declined_reason` | text \| null | |
| `contact_phone` | text \| null | **column-level privilege revoked from `anon`/`authenticated`** — not directly selectable; only reachable via the `get_listing_contact_phone` RPC |
| `seller_verified` | bool | snapshot of the seller's verified status at listing-create time |
| `is_featured` | bool | set by the `featured_spot` premium plan |
| `featured_until` | timestamptz \| null | |
| `bumped_at` | timestamptz \| null | set by the `bump_fee` premium plan |
| `views` | int | incremented via `increment_listing_views` RPC |
| `video_url` | text \| null | |
| `expires_at` | timestamptz \| null | |
| `created_at` / `updated_at` | timestamptz | |

Indexes (confirmed live, from `perf_indexes.sql`'s own inspection comment):
`listings_status_idx`, `listings_category_id_idx`, `listings_user_id_idx`,
unique `listings_short_id_idx`, partial `listings_featured_idx`
(`is_featured, featured_until WHERE is_featured = true`), functional
`listings_title_trgm_idx` (`gin_trgm_ops` on `lower(title)`, backs
`search_listings`'s fuzzy match) — plus, added by `perf_indexes.sql`:
`idx_listings_status_category_created`, `idx_listings_status_featured_bumped`,
`idx_listings_status_category_price`, `idx_listings_status_location`,
`idx_listings_expires_at` (partial, `WHERE expires_at IS NOT NULL`).

### `listing_images`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `listing_id` | uuid | FK → `listings.id` |
| `storage_path` | text | path in the `listing-images` bucket |
| `position` | int | display order; index 0 = cover photo |
| `width` / `height` | int \| null | |
| `blur_score` | numeric \| null | stdev-based blur proxy, see `src/lib/image-hash.ts` |
| `phash` | `bit(64)` | perceptual hash for duplicate detection (packed as a 64-char `'0'/'1'` string from the app side — see `src/lib/image-hash.ts`) |
| `created_at` | timestamptz | |

Index: `listing_images_listing_id_idx`.

### `listing_moderation_flags`
Auto-flagged listing issues surfaced in the admin moderation queue.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `listing_id` | uuid | FK → `listings.id` |
| `flag_type` | text | `blurry_image` \| `duplicate_image` \| `contact_in_description` |
| `detail` | text \| null | for `duplicate_image`, holds the duplicate listing's UUID |
| `status` | text | `pending` \| `approved` \| `rejected` \| `escalated` |
| `reviewed_by` | uuid \| null | FK → `profiles.id` |
| `reviewed_at` | timestamptz \| null | |
| `created_at` | timestamptz | |

Index: `idx_moderation_flags_listing_id`.

### `categories` → see above. `locations`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `region_name` / `region_slug` | text | |
| `region_order` | int | |
| `district_name` / `district_slug` | text | |
| `district_order` | int | |
| `suburb_name` / `suburb_slug` | text \| null | |
| `suburb_order` | int | |
| `enabled` | bool | |
| `created_at` / `updated_at` | timestamptz | |

Unique composite index on `(region_slug, district_slug)` (leftmost
`region_slug`, confirmed via `perf_indexes.sql`'s comment on why a
`district_slug`-only lookup needed its own separate, non-unique
`idx_locations_district_slug`).

### `conversations`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `listing_id` | uuid | FK → `listings.id` |
| `buyer_id` | uuid | FK → `profiles.id` |
| `seller_id` | uuid | FK → `profiles.id` |
| `last_message_at` | timestamptz | |
| `last_read_by_buyer_at` / `last_read_by_seller_at` | timestamptz \| null | set by `mark_conversation_read` RPC |
| `phone_revealed_by_buyer` / `phone_revealed_by_seller` | bool | flipped by `reveal_phone` RPC |
| `created_at` | timestamptz | |

Indexes: `conversations_buyer_id_idx`, `conversations_seller_id_idx`.

### `messages`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `conversation_id` | uuid | FK → `conversations.id` |
| `sender_id` | uuid | FK → `profiles.id` |
| `body` | text | |
| `deleted_at` | timestamptz \| null | soft delete |
| `created_at` | timestamptz | |

Index: `messages_conversation_id_created_at_idx`. Realtime is enabled on
this table — the chat UI subscribes to `postgres_changes` (`INSERT`) via
Supabase Realtime (see INTEGRATIONS.md).

### `saved_listings`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK → `profiles.id` |
| `listing_id` | uuid | FK → `listings.id` |
| `created_at` | timestamptz | |

Unique composite `saved_listings_user_id_listing_id_key`; index
`saved_listings_user_id_idx`.

### `reports` (listing reports)
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `listing_id` | uuid | FK → `listings.id` |
| `reporter_id` | uuid \| null | FK → `profiles.id` |
| `reason` | text \| null | free text |
| `status` | text | `open` \| `resolved` \| `dismissed` |
| `priority` | bool | |
| `created_at` | timestamptz | |

Partial unique index `reports_reporter_listing_open_uidx` (scoped
`WHERE status = 'open'`, on `(reporter_id, listing_id)`) — lets the same
person re-report the same listing only after the first report is resolved.

### `profile_feedback` / `profile_feedback_replies` / `feedback_reports`
Seller reviews left by other users, plus reply/report handling.

**`profile_feedback`**: `id` (PK), `profile_id` (FK → `profiles.id`, the
subject), `author_id` (FK → `profiles.id`, the reviewer), `sentiment`
(`positive` \| `neutral` \| `negative`), `message` (text, length-capped per
app convention — see `profiles.bio`'s explicit CHECK; this table's own
constraint isn't in-repo but is referenced as existing), `created_at`.

**`profile_feedback_replies`**: `id` (PK), `feedback_id` (FK →
`profile_feedback.id`), `author_id` (FK → `profiles.id`), `message`,
`created_at`.

**`feedback_reports`**: `id` (PK), `feedback_id` (FK →
`profile_feedback.id`), `reporter_id` (FK → `profiles.id`), `reason`
(`harassment` \| `spam` \| `offensive_content` \| `fake` \| `other`),
`status` (`open` \| `resolved` \| `dismissed`), `created_at`. A unique
constraint on `(feedback_id, reporter_id)` is implied by app code handling
Postgres error `23505` on insert with "You've already reported this
feedback", though its DDL isn't in-repo.

### `premium_plans`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `name` | text | |
| `description` | text \| null | |
| `plan_type` | text | `pay_per_ad` \| `subscription` \| `featured_spot` \| `bump_fee` |
| `price` | numeric | |
| `duration` | text \| null | `monthly` \| `yearly` |
| `duration_days` | int \| null | |
| `features` | text[] | |
| `is_enabled` | bool | |
| `display_order` | int | |
| `created_at` / `updated_at` | timestamptz | |

### `payments` / `purchases`
Two-table model: `payments` is one row per provider transaction attempt;
`purchases` is one row per plan-purchase, linked to a payment once it
succeeds. See [API.md](./API.md) for the full initialize→webhook flow.

**`payments`**: `id` (PK), `user_id` (FK → `profiles.id`), `listing_id`
(FK → `listings.id`, nullable), `provider` (`paystack` \| `flutterwave`),
`reference` (provider's transaction reference — this is the idempotency
key `markPaymentSuccess()` looks up by), `amount`, `currency`, `status`
(`pending` \| `success`), `created_at` / `updated_at`.

**`purchases`**: `id` (PK), `user_id` (FK → `profiles.id`), `plan_id` (FK
→ `premium_plans.id`), `listing_id` (FK → `listings.id`, nullable — null
for account-wide plans), `payment_id` (FK → `payments.id`, nullable),
`status` (`pending` \| `active` \| `cancelled` \| `expired` — "expired" is
often computed client-side from `expires_at` rather than stored),
`starts_at` / `expires_at`, `created_at` / `updated_at`.

### `homepage_slides`
The one table whose full `CREATE TABLE` SQL actually exists in-repo
(`supabase/migrations/homepage_slides.sql`):

```sql
create table homepage_slides (
  id uuid primary key default gen_random_uuid(),
  image_path text not null,
  headline text,
  link_url text,
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

RLS (also fully in-repo): public `SELECT` (`using (true)`); `INSERT`/
`UPDATE`/`DELETE`/`SELECT` for admin/super_admin only (`exists (select 1
from profiles where id = auth.uid() and role in ('admin','super_admin'))`).

Per [ARCHITECTURE.md](./ARCHITECTURE.md) / `BUGS_AND_TODO.md`: the admin
side of this feature is fully live, but nothing on the public homepage
renders slides from this table yet.

### `feature_flags` / `site_settings`
Both keyed on `key` (text) rather than a UUID `id` — simple key-value
tables for admin-toggleable behavior.

**`feature_flags`**: `key` (PK), `enabled` (bool), `description` (text \|
null), `updated_at`. `maintenance_mode` is the one the root middleware
polls every request (see ARCHITECTURE.md).

**`site_settings`**: `key` (PK), `value` (text \| null), `description`
(text \| null), `updated_at`.

### `support_tickets`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid \| null | FK → `profiles.id`; null for anonymous/guest submissions |
| `name` / `email` / `topic` / `message` | text | required |
| `status` | text | `open` \| `in_progress` \| `resolved` |
| `created_at` / `updated_at` | timestamptz | |

### `admin_audit_log` / `admin_user_warnings`
**`admin_audit_log`**: `id` (PK), `action` (text), `actor_id` (FK →
`profiles.id`, nullable), `target_type` (text), `target_id` (uuid \|
null), `detail` (Json \| null), `created_at`. Written by
`logAdminAction()` (`src/lib/admin/audit-log.ts`) from nearly every admin
mutating action.

**`admin_user_warnings`**: `id` (PK), `admin_id` (FK → `profiles.id`,
nullable), `user_id` (FK → `profiles.id`), `message` (text),
`created_at`. Written by `logWarningAction()`, reused by both the reports
and reviews moderation flows.

## Triggers

**None found.** No `CREATE TRIGGER` statement exists anywhere in this
repo. `updated_at` is set manually by application code on every relevant
`.update()` call (confirmed at every update call site checked across
admin actions, payments, etc.) rather than by a DB trigger — if you add a
new mutating action, remember to set `updated_at` yourself; nothing does
it for you.

## Row Level Security (RLS)

RLS is real and enforced on this database — e.g. `listings.contact_phone`
is genuinely unreadable via a normal `select` (only exposed through the
`get_listing_contact_phone` RPC), and `createAdminClient()`'s own doc
comment describes the service-role client as bypassing RLS "entirely,"
implying every other client goes through it. But as noted at the top of
this doc, the actual policy definitions for almost every table are **not
committed anywhere in this repo** — only `homepage_slides` and the three
Storage buckets have their real `CREATE POLICY` SQL checked in. If you need
to reason about exactly who can read/write a given table, check the
Supabase dashboard directly rather than trusting an absence of policy SQL
here to mean "no RLS."

## Postgres functions (RPCs)

Called via `supabase.rpc(...)` from the app. Full SQL body available for
these three (all defined in `supabase/migrations/`, and each superseded an
earlier version via `DROP FUNCTION` + recreate, since changing a return
column list isn't allowed under `CREATE OR REPLACE`):

- **`get_public_seller_profile(p_user_id uuid)`** — `STABLE SECURITY
  DEFINER`. Returns a seller's public profile
  (`id, full_name, location, verified, member_since, bio, avatar_url`) —
  but only if that user has at least one `active` listing; otherwise no
  row. This is what gates whether `/seller/[id]` / `/u/[id]` resolves at
  all.
- **`get_top_sellers(limit_count integer default 3)`** — `STABLE SECURITY
  DEFINER`. Groups active listings by seller, returns
  `(user_id, full_name, location, listing_count, avatar_url)` ordered by
  listing count, replacing what used to be a 500-row client-side fetch +
  JS aggregation.
- **`search_listings(search_query, category_slug, location_filter,
  min_price, max_price, exclude_location, p_page, sort)`** — `STABLE`.
  Powers the homepage/category listing grid: filters active listings by
  category (including subcategories), location, price range, and a fuzzy
  title match (`pg_trgm`'s `word_similarity(...) > 0.25` OR `ilike`).
  Supports `sort` = `newest` \| `price_asc` \| `price_desc` \| default
  "recommended" (featured-first, then title-match relevance if searching,
  then most-recently-bumped-or-created). Paginates 24/page via a
  `count(*) over()` window function. Depends on the `pg_trgm` extension
  (enabled directly on the live DB, not via a committed migration).

Called by the app but **defined only on the live database** (signature
known from `database.types.ts`, body not in-repo):

| RPC | Purpose |
|---|---|
| `category_counts()` | `{category_id, listing_count}[]` for the admin dashboard |
| `get_listing_contact_phone(p_listing_id uuid)` | The gated accessor for `listings.contact_phone` — its internal access-control logic (who's allowed to see the number) lives entirely in this function, not visible from the repo |
| `get_seller_listing_stats(p_user_id uuid)` | Powers `/dashboard/insights` — per-listing views/saves/conversations/category rank |
| `increment_listing_views(listing_id uuid)` | Fired on every listing detail page view |
| `mark_conversation_read(p_conversation_id uuid)` | Sets the caller's `last_read_by_*_at` on a conversation |
| `reveal_phone(p_conversation_id uuid)` | Flips the caller's `phone_revealed_by_*` flag |
| `is_admin` / `is_super_admin` / `is_suspended(user_id uuid)` | Return boolean; never called directly from `src/`, so these almost certainly back RLS `USING` clauses on the live DB rather than being app-facing |

## Storage buckets

| Bucket | Public? | Holds | Write policy |
|---|---|---|---|
| `listing-images` | Yes | Listing photos, watermarked+resized server-side on upload | Own-UID-prefixed-folder only (pattern confirmed by analogy in the `avatars` migration comment; this bucket's own policy SQL isn't in-repo) |
| `homepage-slides` | Yes | Admin-managed homepage banner images | Admin/super_admin only (full SQL in-repo, see above) |
| `avatars` | Yes | Profile photos, 512×512 webp | Own-UID-prefixed-folder only (`(storage.foldername(name))[1] = auth.uid()::text`), 5MB limit, `image/jpeg`\|`image/png`\|`image/webp` only |

## Extensions in use

- **`pg_trgm`** — trigram matching, backs `search_listings`'s fuzzy title
  search and the `listings_title_trgm_idx` functional index. Enabled
  directly on the live database; no committed migration creates it.
