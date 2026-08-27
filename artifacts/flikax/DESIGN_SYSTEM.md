# Design System

The visual language, tokens, and conventions this codebase already follows
— read this before adding a new color, font size, or component pattern, so
you extend the existing system instead of duplicating it. Every token here
lives in one place: `src/app/globals.css`.

## Foundation: Tailwind v4, CSS-first

This project uses Tailwind CSS v4's CSS-first configuration — there is no
`tailwind.config.ts`. Tokens are declared as CSS custom properties in
`:root`/`.dark` in `globals.css`, then mapped into Tailwind's utility
namespace via an `@theme inline { ... }` block in the same file. To add a
new color/size/etc. token: add the CSS variable, then add its
`--color-*`/`--text-*`/etc. mapping in the `@theme inline` block so Tailwind
generates a utility class for it (e.g. `--color-cream` → `bg-cream`,
`text-cream`, `border-cream`, ...).

shadcn/ui is configured `new-york` style, `neutral` base color, no class
prefix (see `components.json`). Primitive components (Button, Card, Dialog,
Input, Textarea, Sheet, DropdownMenu, AlertDialog, Checkbox, Badge, Table,
...) live in `src/components/ui/` — these are the shadcn-generated base
layer; site-specific composition happens in `src/components/*`.

## Color

**One brand color drives every interactive element site-wide** — buttons,
links, active states, highlights, focus rings. Nothing else should
introduce a second general-purpose accent color (see the two deliberate,
narrowly-scoped exceptions below).

| Token | Value | Use |
|---|---|---|
| `--brand` | `#149777` | Borders, rings, icon fills, hover backgrounds — anywhere only WCAG's 3:1 (non-text/large-text) contrast floor applies |
| `--brand-dark` | `#0d7058` | **All brand-colored text.** White-on-`--brand` is 3.67:1, which fails the 4.5:1 floor for normal body/link text — `--brand-dark` clears 6.04:1. Also `--header-bg` and shadcn's `--primary`. |
| `--brand-light` | `#eaf6f3` | Light tint backgrounds (selected states, icon-bubble fills) |
| `--background` | `#e4e7eb` | Page background (a muted blue-grey, not near-white, so white cards read as sitting on a surface) |
| `--cta-yellow` / `--cta-yellow-hover` | `#ffc800` / `#e6b400` | **The one deliberate non-brand accent.** "Post Ad" and the hero search button only — text/icon on it is black (white fails 3:1 badly). Don't reach for this color elsewhere. |
| `--location-link` / `--location-link-hover` | `#0074ba` / `#005d95` | **Second deliberate non-brand exception**, scoped to `LocationPickerModal`'s region/district/suburb list wherever it appears (search, sidebar filters, post-ad form) |
| `--cream` | `#f7ecd6` | Warm tint behind product photos in listing cards / mobile category strip |

Rule of thumb when adding new UI: if it's interactive, it's `--brand`
(borders/icons) or `--brand-dark` (text). If you think you need a third
accent color, that's a sign to stop and check with whoever owns the design
direction — the two exceptions above were each a specific, deliberate
brand/reference decision, not a precedent for "add another one when it
feels right."

### Dark mode: present but not wired up

`.dark` has a complete token set in `globals.css`, but no toggle exists
anywhere in the app (`next-themes`' `ThemeProvider` is configured with
`defaultTheme: "light"` and nothing ever applies the `.dark` class). Most
components also hardcode `bg-white`/`neutral-*` rather than the semantic
tokens (`--card`, `--background`, etc.), so flipping a toggle on today would
produce a half-dark, half-light UI. Treat `.dark`'s values as a starting
point, not a finished feature, if you're the one wiring up an actual toggle.

## Typography

- **Body/UI text**: `--font-sans` = `Arial, Helvetica, sans-serif` — a
  short system-font stack, not a webfont, chosen deliberately (see the
  comment in `globals.css`): the previous Inter webfont's font file didn't
  ship the Ghana Cedi Sign glyph (₵, U+20B5), so every price fell back to a
  different font in the chain mid-string.
- **Headings**: `--font-logo` = Baloo 2 (a Google Font, rounded sans),
  applied via `font-logo`.
- **The literal "Flikax" wordmark only**: `--font-wordmark` = `Georgia,
  "Times New Roman", Times, serif` — a bold classic serif per the brand
  reference, distinct from `--font-logo`. Only `FlikaxLogo` and the
  page-`<h1>` wordmark treatments use this; don't reach for it elsewhere.
- **Extra small sizes** Tailwind doesn't have (its scale jumps
  `text-xs`(12px) → `text-sm`(14px) → `text-base`(16px) with nothing
  smaller): `text-2xs`(11px), `text-3xs`(10px), `text-4xs`(9px). Also
  `text-13`(13px) and `text-15`(15px) for two specific one-off call sites
  (listing card title, listing description) that needed to sit between two
  standard sizes. **Always use these named classes instead of a new
  `text-[Npx]` arbitrary value** — that duplication (30+ scattered one-off
  pixel values before these were introduced) is exactly what these tokens
  exist to prevent.

## Shadows

`--shadow-sm/md/lg/xl` are tuned darker than Tailwind's defaults (which read
as invisible against this site's light `neutral-50`-ish surfaces) — use
these named shadow utilities rather than reaching for arbitrary
`shadow-[...]` values or Tailwind's stock `shadow-md`/etc.

## Standing rule: square corners

**Every box-shaped element — inputs, textareas, buttons, cards, modals,
dropdowns, dialogs, sheets, auth pages — uses square corners.** No
`rounded-*` utility (other than `rounded-full`) belongs on a box/container
element anywhere in this codebase. This applies going forward, not just to
what's already been swept.

`rounded-full` is still correct — but only for things that are genuinely
**circular or pill-shaped by nature**, not merely "a box someone rounded":
- Avatars, profile-picture circles, category icon bubbles
- Icon-only circular buttons (header bell/bookmark/notification icons,
  close (X) buttons, floating action-style buttons with no text label)
- Status dots/badges, unread indicators, carousel pagination dots
- Toggle switches (the track *and* its thumb — this is the one place a
  "pill" shape is the actual UI convention, not a rounded box)
- `Badge` (`src/components/ui/badge.tsx`) and any passive, non-clickable
  status/count chip

The dividing line for anything ambiguous: **is it interactive with a
visible text label** (a button, a tab, a filter chip you click, a text
input)? → square. **Is it a decorative/passive circle** (avatar, dot,
icon-only button, toggle, badge)? → `rounded-full` is fine. When in doubt,
square is the safer default — it's the norm, `rounded-full` is the
exception that has to earn its place.

**One more named exception, not `rounded-full`:** `CategoryMobileFilterPills`
(`src/components/category-mobile-filter-pills.tsx`) uses `rounded-[20px]` —
text-labeled buttons that would otherwise be square by the rule above. A
deliberate, explicit product carve-out for this one component specifically
(the mobile category-page pill row), not a precedent — don't reach for
`rounded-[20px]` (or any other partial radius) elsewhere without the same
explicit sign-off.

## Divider / gridline visibility

Use `neutral-300` (or `slate-300` in the few places that already use the
slate family, e.g. most of the admin panel) for any divider, border, or
gridline meant to actually be seen — between list rows, table
rows/columns, menu items, card boundaries. **`neutral-100`/`neutral-200`
(and `slate-50`/`slate-100`) read as functionally invisible** against this
site's backgrounds and have been swept out of every list/menu/grid/table
divider for that reason. This is a standing rule, not a one-time cleanup —
don't reintroduce a faint divider color in new work.

For a CSS Grid layout that needs gridlines between cells (not just rows),
don't reach for Tailwind's `divide-x`/`divide-y` utilities — they only draw
a border between DOM siblings, which on a multi-column grid puts a
left-border on the first item of every row too (a "ladder" pattern, not
real column lines). Use `gap-px` + a colored container background + a
solid background on each cell instead (see the "Specifications" spec grid
on the listing detail page, or the admin listing detail page, for the
working pattern) — the 1px gap between cells reads as a clean hairline
gridline at every column count and breakpoint with no special-casing.

## Spacing / touch targets

- `min-h-11` (44px) shows up throughout interactive elements (nav links,
  form fields, buttons) — that's the standard touch-target minimum;
  preserve it on new tappable elements rather than letting them shrink
  below it on mobile.
- Generous padding is the default for anything a user picks from in a list
  (e.g. `CategoryPickerModal`/`LocationPickerModal` rows use `py-4`) — don't
  default to a cramped `py-1`/`py-1.5` on a genuinely tappable list row.

## Category page layout measurements

The `/[category]` page's subcategory/quick-filter tile row
(`category-quick-filters.tsx`) and sidebar (`category-sidebar-filters.tsx`,
`category-subcategory-list.tsx`) use a few hardcoded arbitrary-value
measurements rather than named tokens, deliberately matched to a reference
Ghanaian marketplace's own CSS so the page reads as a familiar,
professionally-dense filtering UI rather than one designed from scratch:

| Measurement | Value | Where |
|---|---|---|
| Quick-filter tile (desktop) | `110px` wide, `124px` min-height, `10px 4px 8px` padding | `CategoryQuickFilters`, `sm:grid` row |
| Quick-filter tile (mobile) | `75px` wide, height auto, zero-gap `flex-wrap` (not a scroller) | `CategoryQuickFilters`, `sm:hidden` row |
| Quick-filter grid gap | `10px` columns / `16px` rows (desktop) | `CategoryQuickFilters` desktop grid |
| Quick-filter icon | `60px` circle container, `48px` (`size-12`) icon inside, `2.5` stroke-width | `CategoryQuickFilters`'s `QuickFilterTile` |
| Sidebar column width | `285px` | `CategorySidebarFilters`, `CategorySubcategoryListDesktop`, and the `[category]/page.tsx` flex wrapper — keep all three in sync if this changes |
| Price/range input height | `48px` (`h-12`), `110px` max-width | Sidebar's Price/range `FilterFolder` inputs + inline Apply-search icon button |
| Filter accordion header | `50px` min-height, `24px` (`size-6`) chevron | `FilterFolder` |
| Mobile filter pill | `36px` (`h-9`) tall, `1px solid #d0dadd`, `20px` radius (see the square-corners exception above), `8px 16px` padding | `CategoryMobileFilterPills` |

These are layout-only. **Color and corner radius on this page still follow
this file's own rules above** — `--brand`/`--brand-dark` (not the reference
site's own green) and square corners (not the reference's `border-radius`,
with the one pill exception noted above) — matching a reference site's
measurements doesn't mean matching its brand.

`ListingGrid`'s results grid (shared with the homepage) switches its whole
layout model at the `sm:` breakpoint, not just its column count: a plain
`grid grid-cols-2` below `sm:` (fixed `280px` card min-height, `4:3` image
aspect), CSS multi-column masonry (`columns-2`/`3`/etc., variable image
aspect) from `sm:` up. See that file's own comment for why — multi-column's
column-major fill can leave the second mobile column visibly empty with few
items, which a real grid can't do.

## Icons

- **Lucide React** (`lucide-react`) for all generic UI icons.
- **`react-icons/fa6`** for third-party brand glyphs (Facebook, X,
  Instagram, LinkedIn, Apple, Google Play, ...) as the underlying SVG path,
  wrapped in this codebase's own branded circle-badge components in
  `src/components/icons/social-icons.tsx` (`FacebookIcon`, `XIcon`,
  `TikTokIcon`, `InstagramIcon`, `LinkedInIcon`, `WhatsAppIcon`,
  `GoogleIcon`) — each is a self-contained, correctly-colored circular badge
  (own brand background + white glyph), so a consumer just sets a `size-*`
  class and never needs to hand-wire the brand color/shape itself. Always
  reach for one of these over rendering a bare `react-icons` glyph directly
  when it's a recognizable brand mark — a flat monotone glyph reads as
  washed-out/unrecognizable next to the others.
- **Category icons**: one curated Lucide icon per category/subcategory
  slug, resolved via `resolveCategoryIcon()` in `src/lib/category-icons.ts`
  and rendered through `CategoryThumb` (`src/components/category-thumb.tsx`)
  everywhere a category needs a small badge/thumbnail — this also falls
  back to a real photo (`resolveCategoryImage()`) when one exists for that
  category, so always go through `CategoryThumb` rather than rendering an
  icon directly. `CategoryQuickFilters`' tile row uses `resolveCategoryIcon`
  the same way for a top-level page's subcategory tiles, and `getTypeIcon`
  (`category-filters.ts`) for a leaf page's Type tiles.
- **Don't scrape/embed a reference site's own icon assets.** When matching a
  competitor reference site's category-page layout, real icon `<img>` src
  values captured in a SingleFile/devtools snapshot are frequently just a
  blurred lazy-load placeholder, not the final asset (checked by decoding
  one: 96×96, clearly blurred) -- and even where they aren't, downloading
  and shipping another company's actual icon artwork in this repo is the
  same trademark/licensing concern already called out for `BRAND_COLORS`
  (`category-filters.ts`) monogram colors standing in for real logos. Use
  Lucide (sized up, e.g. `size-12`/`strokeWidth={2.5}`, if the reference's
  icons read as bold/large) instead, or ask for real source files.

## Component conventions worth knowing

- **`CategoryPickerModal`** (`src/components/category-picker-modal.tsx`)
  and **`LocationPickerModal`** (`src/components/location-picker-modal.tsx`)
  share the same shell pattern: full-page takeover on mobile
  (`fixed inset-0 ... sm:items-center sm:justify-center sm:bg-neutral-900/70`),
  a centered dialog once there's room for it on `sm:` and up. Follow this
  same shell for any new full-list picker rather than inventing a new modal
  pattern.
- **`SellCta`** (`src/components/cta/sell-cta.tsx`) is the single source of
  truth for every "Sell / Post an Ad / Create Listing"-style call to
  action — don't hand-roll another Link-to-`/sell` button; add a new
  `variant`/`size` to this component instead if the existing ones don't fit.
- Glassmorphism (`.glass` utility class in `globals.css`, backed by
  `--glass-bg`/`--glass-border`/`--glass-shadow`) is reserved for
  headers/sticky bars/modal chrome that has something behind them to
  actually read as "glass" — not a general-purpose translucent-panel style.
