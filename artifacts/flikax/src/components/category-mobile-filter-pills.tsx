"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { LocationPickerModal } from "@/components/location-picker-modal";
import { useRegions } from "@/lib/use-regions";

/* Tonaton .b-short-filters pill -> Flikax h-9 rounded-[20px] border-[#d0dadd] px-4
 * text-sm. Note on sourcing: unlike every other measurement fixed this pass, this
 * specific pill row's CSS (border/radius/height/padding) could not be located in
 * either reference file actually in this project (grep for .b-short-filters,
 * border-radius:20px, and border-radius:100px all came back empty or matched an
 * unrelated element) -- built from the spec given directly rather than a verified
 * extraction, unlike the rest of this component family. */
const PILL_BASE =
  "flex h-9 shrink-0 items-center gap-1 whitespace-nowrap rounded-[20px] border px-4 text-sm leading-5 font-medium tracking-[0.1px] transition-colors";
const PILL_INACTIVE = "border-[#d0dadd] bg-white text-black hover:bg-[#eef2f4]";
// Selected state keeps Flikax's own brand color (not the reference's #2da57c/#ceffee)
// per this app's single-brand-color rule -- brand-light tint + brand border, text
// stays black per the reference's own selected-state text color.
const PILL_ACTIVE = "border-brand bg-brand-light text-black";

/** Opens the exact same mobile filter sheet CategorySidebarFilters already renders
 * (see its own "flikax:open-category-filters" listener) -- this event is how a pill
 * here does that without duplicating a second sheet, since [category]/page.tsx (a
 * Server Component) can't hold the shared open/close state a normal lifted-state
 * approach would need between these two sibling client components. */
function openFilterSheet() {
  window.dispatchEvent(new Event("flikax:open-category-filters"));
}

export function CategoryMobileFilterPills({ categorySlug }: { categorySlug: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const regions = useRegions();
  const [locationOpen, setLocationOpen] = useState(false);

  const allDistricts = regions.flatMap((r) => r.districts);
  const locationName = searchParams.get("location");
  const activeDistrict = allDistricts.find((d) => d.name === locationName);
  const locationLabel = activeDistrict?.name ?? locationName ?? "All Ghana";

  const hasPrice = Boolean(searchParams.get("minPrice") || searchParams.get("maxPrice"));
  const hasMake = Boolean(searchParams.get("attr_make"));
  const hasCondition = Boolean(searchParams.get("attr_condition"));
  const verified = searchParams.get("verified") === "yes";
  const discount = searchParams.get("discount") === "yes";
  const activeCount =
    (locationName ? 1 : 0) + (hasPrice ? 1 : 0) + (hasMake ? 1 : 0) + (hasCondition ? 1 : 0) + (verified ? 1 : 0) + (discount ? 1 : 0);

  function toggleBoolParam(key: "verified" | "discount") {
    const params = new URLSearchParams(searchParams);
    params.delete("page");
    if (params.get(key) === "yes") params.delete(key);
    else params.set(key, "yes");
    const qs = params.toString();
    router.push(qs ? `?${qs}` : "?");
  }

  function handleLocationSelect(name?: string) {
    const params = new URLSearchParams(searchParams);
    params.delete("location");
    const target = name ? allDistricts.find((d) => d.name === name) : undefined;
    if (target) {
      const qs = params.toString();
      router.push(qs ? `/${categorySlug}/${target.slug}?${qs}` : `/${categorySlug}/${target.slug}`);
      setLocationOpen(false);
      return;
    }
    if (name) params.set("location", name);
    const qs = params.toString();
    router.push(qs ? `/${categorySlug}?${qs}` : `/${categorySlug}`);
    setLocationOpen(false);
  }

  return (
    <>
      {/* -mx-4 px-4 (Jiji-style full-bleed edge, same pattern used elsewhere on
          mobile) so the row scrolls flush to the screen edge instead of stopping
          short at the page's own padding. */}
      <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:hidden">
        <button type="button" onClick={() => setLocationOpen(true)} className={`${PILL_BASE} ${locationName ? PILL_ACTIVE : PILL_INACTIVE}`}>
          {locationLabel}
        </button>
        <button type="button" onClick={openFilterSheet} className={`${PILL_BASE} ${hasPrice ? PILL_ACTIVE : PILL_INACTIVE}`}>
          Price, GH₵
        </button>
        <button type="button" onClick={openFilterSheet} className={`${PILL_BASE} ${hasMake ? PILL_ACTIVE : PILL_INACTIVE}`}>
          Make
        </button>
        <button type="button" onClick={openFilterSheet} className={`${PILL_BASE} ${hasCondition ? PILL_ACTIVE : PILL_INACTIVE}`}>
          Condition
        </button>
        <button type="button" onClick={() => toggleBoolParam("verified")} className={`${PILL_BASE} ${verified ? PILL_ACTIVE : PILL_INACTIVE}`}>
          Verified sellers
        </button>
        <button type="button" onClick={() => toggleBoolParam("discount")} className={`${PILL_BASE} ${discount ? PILL_ACTIVE : PILL_INACTIVE}`}>
          Discount
        </button>
        <button type="button" onClick={openFilterSheet} className={`${PILL_BASE} ${PILL_INACTIVE}`}>
          <SlidersHorizontal className="size-3.5" />
          All filters
          {activeCount > 0 && (
            <span className="flex size-4 items-center justify-center rounded-full bg-brand-dark text-3xs font-bold text-white">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      <LocationPickerModal open={locationOpen} onClose={() => setLocationOpen(false)} onSelect={handleLocationSelect} />
    </>
  );
}
