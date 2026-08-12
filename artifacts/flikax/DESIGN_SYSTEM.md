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
  icon directly.

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
