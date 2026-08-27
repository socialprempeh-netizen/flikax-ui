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
    <div className="mb-4">
      {/* Mobile: horizontal scroll, fixed-size chips (75px, matching the reference
          grid's own sub-767px tile size). Desktop: an auto-fit grid of 110px tiles
          (also matching the reference) so the row wraps at a fixed tile size instead
          of stretching tiles edge to edge when there are only 2-3 values. */}
      <div className="flex gap-2.5 overflow-x-auto pb-1 sm:hidden">
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
            className="h-auto w-[75px] shrink-0"
          />
        ))}
      </div>
      <div
        className="hidden gap-x-2.5 gap-y-4 sm:grid"
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
      className={`flex flex-col items-center justify-center gap-2 border-2 bg-white p-[10px_4px_8px] text-center transition-colors ${
        isActive ? "border-brand bg-brand-light" : "border-neutral-300 hover:border-neutral-400"
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
        Icon && <Icon className={`size-7 shrink-0 ${isActive ? "text-brand-dark" : "text-neutral-600"}`} />
      )}
      <span
        className={`w-full truncate text-xs font-semibold ${isActive ? "text-brand-dark" : "text-neutral-700"}`}
      >
        {item.value}
      </span>
    </Link>
  );
}
