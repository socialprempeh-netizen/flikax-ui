import Link from "next/link";
import { getQuickFilterStyle, getBrandColor, getTypeIcon } from "@/lib/category-filters";

export function CategoryQuickFilters({
  items,
  topLevelSlug,
  leafSlug,
  attributeKey,
  activeValue,
  baseHref,
  currentQuery,
}: {
  items: { value: string; count: number }[];
  topLevelSlug: string | undefined;
  leafSlug?: string;
  attributeKey: string;
  activeValue?: string;
  baseHref: string;
  currentQuery: URLSearchParams;
}) {
  // Not worth a filter row for a single (or no) distinct value in this category.
  if (items.length < 2) return null;

  const style = getQuickFilterStyle(topLevelSlug, leafSlug);

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
          horizontal scroller -- there is no overflow-x/scroll-snap anywhere in the
          reference stylesheet for this element, verified by full-text search.
          Desktop: an auto-fit grid of 110px tiles (grid-template-columns:
          repeat(auto-fit,minmax(110px,1fr)), gap 10px/16px), so the row wraps at a
          fixed tile size instead of stretching tiles edge to edge when there are
          only 2-3 values. */}
      <div className="flex flex-wrap sm:hidden">
        {items.map((item) => (
          <QuickFilterTile
            key={item.value}
            item={item}
            style={style}
            topLevelSlug={topLevelSlug}
            leafSlug={leafSlug}
            attributeKey={attributeKey}
            activeValue={activeValue}
            baseHref={baseHref}
            currentQuery={currentQuery}
            className="h-auto w-[75px]"
          />
        ))}
      </div>
      <div
        className="hidden gap-x-2.5 gap-y-4 py-4 sm:grid"
        style={{ gridTemplateColumns: `repeat(auto-fit, minmax(110px, 1fr))` }}
      >
        {items.map((item) => (
          <QuickFilterTile
            key={item.value}
            item={item}
            style={style}
            topLevelSlug={topLevelSlug}
            leafSlug={leafSlug}
            attributeKey={attributeKey}
            activeValue={activeValue}
            baseHref={baseHref}
            currentQuery={currentQuery}
            className="w-[110px] min-h-[124px]"
          />
        ))}
      </div>
    </div>
  );
}

function QuickFilterTile({
  item,
  style,
  topLevelSlug,
  leafSlug,
  attributeKey,
  activeValue,
  baseHref,
  currentQuery,
  className = "",
}: {
  item: { value: string; count: number };
  style: "brand" | "type";
  topLevelSlug: string | undefined;
  leafSlug?: string;
  attributeKey: string;
  activeValue?: string;
  baseHref: string;
  currentQuery: URLSearchParams;
  className?: string;
}) {
  const isActive = activeValue === item.value;
  const params = new URLSearchParams(currentQuery);
  params.delete("page");
  if (isActive) params.delete(`attr_${attributeKey}`);
  else params.set(`attr_${attributeKey}`, item.value);
  const qs = params.toString();

  const Icon = style === "type" ? getTypeIcon(topLevelSlug, item.value, leafSlug) : null;
  const brandColor = style === "brand" ? getBrandColor(item.value) : null;

  return (
    <Link
      href={qs ? `${baseHref}?${qs}` : baseHref}
      // The reference's .filter-grid__item has no per-tile border at all -- only
      // the card wrapper above does -- and its only interactive state is a
      // background tint on hover (background:#2da47c33, a ~20% alpha of their
      // green) and cursor:pointer. bg-brand-light stands in for that tint (this
      // app's own brand color, not a literal copy of #2da47c33) and does double
      // duty as the "selected" state too, since the reference snapshot has no
      // active tile to verify a distinct selected treatment from.
      className={`flex flex-col items-center justify-center gap-2 p-[10px_4px_8px] text-center transition-colors ${
        isActive ? "bg-brand-light" : "hover:bg-brand-light/60"
      } ${className}`}
    >
      {style === "brand" ? (
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-white"
          style={{ backgroundColor: brandColor ?? undefined }}
        >
          {item.value[0]?.toUpperCase()}
        </span>
      ) : (
        // 60px circle (reference .filter-grid__img-home-top: height/width 60px)
        // with a tinted circle behind the icon (reference's own :after pseudo-
        // element is #ceffee -- brand-light stands in here, same reasoning as the
        // hover tint above) and the icon itself at 48px (size-12) so it reads as
        // "clear and big," not the previous 28px (size-7).
        Icon && (
          <span className="flex size-[60px] shrink-0 items-center justify-center rounded-full bg-brand-light">
            <Icon className={`size-12 ${isActive ? "text-brand-dark" : "text-neutral-700"}`} />
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
          isActive ? "text-brand-dark" : "text-black"
        }`}
      >
        {item.value}
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
