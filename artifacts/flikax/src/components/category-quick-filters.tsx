import Link from "next/link";
import type { LucideIcon } from "lucide-react";

/** One tile in the top "sub-menus" bar -- fully resolved by the caller (page.tsx)
 * rather than built here, so this component stays a single, presentational
 * implementation shared by both of its call sites: a top-level category's own
 * subcategories (Cars, Buses & Microbuses, ...) and a leaf category's quick-filter
 * (Make/Type) row. Previously these were two separate components
 * (CategoryQuickFilters + CategorySubcategoryListMobile) both rendering in the same
 * spot on a top-level page's mobile view -- a real, visible duplicate bar. */
export type QuickFilterTileItem = {
  key: string;
  label: string;
  count: number;
  href: string;
  icon?: LucideIcon | null;
  /** Brand-monogram tiles (Toyota/Honda/... on a vehicle leaf) render a colored
   * circle with the first letter instead of an icon. */
  monogramColor?: string | null;
  isActive?: boolean;
};

export function CategoryQuickFilters({ items }: { items: QuickFilterTileItem[] }) {
  // Not worth a filter row for a single (or no) tile.
  if (items.length < 2) return null;

  return (
    // Card wrapper measurements read verbatim off the reference's .filter-grid-bg
    // rule: border-color #d0dadd (this codebase's own "visible divider" color is
    // neutral-300, used here instead per DESIGN_SYSTEM.md's divider-color rule --
    // not a literal hex copy, but the same intent), margin-bottom 24px, and the
    // border disappearing entirely below 767px (full-bleed on mobile, no card
    // chrome) -- verified against the reference CSS, not assumed.
    <div className="mb-6 border border-neutral-300 bg-white px-2 max-sm:border-none max-sm:px-0">
      {/* Mobile (reference @media (max-width:767px)): the reference wraps tiles in
          a zero-gap flex-wrap row (column-gap:0, row-gap:0, flex-wrap:wrap), not a
          horizontal scroller -- there is no overflow-x/scroll-snap anywhere in
          either reference stylesheet for this element, verified by full-text
          search of both. One render of the row, shown only below sm: the desktop
          grid below is the *other* breakpoint of the same data, not a second copy
          of it -- see the component doc comment above for the duplicate this
          replaced. Desktop: an auto-fit grid of 110px tiles (grid-template-columns:
          repeat(auto-fit,minmax(110px,1fr)), gap 10px/16px), so the row wraps at a
          fixed tile size instead of stretching tiles edge to edge when there are
          only 2-3 values. */}
      <div className="flex flex-wrap sm:hidden">
        {items.map((item) => (
          <QuickFilterTile key={item.key} item={item} className="h-auto w-[75px]" />
        ))}
      </div>
      <div
        className="hidden gap-x-2.5 gap-y-4 py-4 sm:grid"
        style={{ gridTemplateColumns: `repeat(auto-fit, minmax(110px, 1fr))` }}
      >
        {items.map((item) => (
          <QuickFilterTile key={item.key} item={item} className="w-[110px] min-h-[124px]" />
        ))}
      </div>
    </div>
  );
}

function QuickFilterTile({ item, className = "" }: { item: QuickFilterTileItem; className?: string }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      // The reference's .filter-grid__item has no per-tile border at all -- only
      // the card wrapper above does -- and its only interactive state is a
      // background tint on hover (background:#2da47c33, a ~20% alpha of their
      // green) and cursor:pointer. bg-brand-light stands in for that tint (this
      // app's own brand color, not a literal copy of #2da47c33) and does double
      // duty as the "selected" state too, since the reference snapshot has no
      // active tile to verify a distinct selected treatment from.
      className={`flex flex-col items-center justify-center gap-2 p-[10px_4px_8px] text-center transition-colors ${
        item.isActive ? "bg-brand-light" : "hover:bg-brand-light/60"
      } ${className}`}
    >
      {item.monogramColor ? (
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-white"
          style={{ backgroundColor: item.monogramColor }}
        >
          {item.label[0]?.toUpperCase()}
        </span>
      ) : (
        // 60px circle (reference .filter-grid__img-home / .filter-grid__img-home-top,
        // both height/width 60px -- confirmed identical across the homepage's own
        // main category grid and a category page's subcategory/type row) with a
        // tinted circle behind the icon (reference's own :after pseudo-element is
        // #ceffee -- brand-light stands in here, same reasoning as the hover tint
        // above) and the icon itself at 48px (size-12), 80% of the container, so
        // it reads as "clear and big," not a small icon lost in a big circle.
        Icon && (
          <span className="flex size-[60px] shrink-0 items-center justify-center rounded-full bg-brand-light">
            <Icon className={`size-12 ${item.isActive ? "text-brand-dark" : "text-neutral-700"}`} strokeWidth={2.5} />
          </span>
        )
      )}
      {/* Reference .filter-grid__content__title: font-size 12px, color #000,
          font-weight 510 (~semibold), line-height 14px. text-2xs (11px) is this
          codebase's closest named size below text-xs(12px) -- see
          DESIGN_SYSTEM.md's note that these named sizes exist specifically so a
          new arbitrary text-[Npx] never needs inventing; leading-[14px] and
          text-black keep the other two values exact. */}
      <span
        className={`w-full truncate text-2xs leading-[14px] font-semibold ${
          item.isActive ? "text-brand-dark" : "text-black"
        }`}
      >
        {item.label}
      </span>
      {/* Reference .filter-grid__content p: font-size 10px, color #889399,
          line-height 12px -- text-3xs is this codebase's 10px named size;
          text-[#889399]/leading-[12px] match the other two exactly. */}
      <span className="w-full truncate text-3xs leading-[12px] text-[#889399]">
        {item.count.toLocaleString()} ads
      </span>
    </Link>
  );
}
