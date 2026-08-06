"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, ChevronDown, Search, X, SlidersHorizontal } from "lucide-react";
import { LocationPickerModal } from "@/components/location-picker-modal";
import { useRegions } from "@/lib/use-regions";
import type { SidebarFilterField } from "@/lib/category-filters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const FIELD_CLASS = "h-auto w-full min-w-0 rounded-lg border-neutral-200 px-2 py-1.5 text-sm focus-visible:border-brand";

// The "Verified sellers"/"Discount" toggle fields (see VERIFIED_SELLERS_FIELD/
// DISCOUNT_FIELD in category-filters.ts) are backed by real listings columns, not a
// per-category attribute, so they read/write a plain query param instead of the
// attr_<key> namespace the rest of this sidebar shares.
const PSEUDO_FIELD_PARAM: Record<string, string> = {
  __verified_sellers: "verified",
  __discount: "discount",
};

function paramNameFor(field: SidebarFilterField) {
  return PSEUDO_FIELD_PARAM[field.key] ?? `attr_${field.key}`;
}

// Long checklists (Colour, Key Features, ...) get an inline search box to narrow
// them; short ones (Condition, Transmission) don't -- that'd be one more control to
// scan past for a 2-3 item list.
const CHECKLIST_SEARCH_THRESHOLD = 6;

type ToggleValue = "" | "yes" | "no";

export function CategorySidebarFilters({
  categorySlug,
  fields,
  activeLocationSlug,
}: {
  categorySlug: string;
  fields: SidebarFilterField[];
  activeLocationSlug?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const regions = useRegions();
  const [locationOpen, setLocationOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const allDistricts = regions.flatMap((r) => r.districts);
  const activeDistrict = allDistricts.find((d) => d.slug === activeLocationSlug);
  const locationDisplayName = activeDistrict?.name ?? searchParams.get("location") ?? "All Ghana";

  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") ?? "");

  const [rangeValues, setRangeValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const field of fields) {
      if (field.type !== "range") continue;
      initial[`${field.key}_min`] = searchParams.get(`attr_${field.key}_min`) ?? "";
      initial[`${field.key}_max`] = searchParams.get(`attr_${field.key}_max`) ?? "";
    }
    return initial;
  });

  const [checklistValues, setChecklistValues] = useState<Record<string, string[]>>(() => {
    const initial: Record<string, string[]> = {};
    for (const field of fields) {
      if (field.type !== "checklist") continue;
      const raw = searchParams.get(`attr_${field.key}`);
      initial[field.key] = raw ? raw.split(",").filter(Boolean) : [];
    }
    return initial;
  });

  const [toggleValues, setToggleValues] = useState<Record<string, ToggleValue>>(() => {
    const initial: Record<string, ToggleValue> = {};
    for (const field of fields) {
      if (field.type !== "toggle") continue;
      const raw = searchParams.get(paramNameFor(field));
      initial[field.key] = raw === "yes" || raw === "no" ? raw : "";
    }
    return initial;
  });

  const [textValues, setTextValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const field of fields) {
      if (field.type !== "text") continue;
      initial[field.key] = searchParams.get(`attr_${field.key}`) ?? "";
    }
    return initial;
  });

  const [checklistSearch, setChecklistSearch] = useState<Record<string, string>>({});
  const [collapsedKeys, setCollapsedKeys] = useState<Record<string, boolean>>({});

  function toggleChecklistValue(key: string, value: string) {
    setChecklistValues((prev) => {
      const current = prev[key] ?? [];
      const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      return { ...prev, [key]: next };
    });
  }

  const activeCount =
    (minPrice ? 1 : 0) +
    (maxPrice ? 1 : 0) +
    Object.values(rangeValues).filter(Boolean).length +
    Object.values(checklistValues).filter((v) => v.length > 0).length +
    Object.values(toggleValues).filter(Boolean).length +
    Object.values(textValues).filter(Boolean).length;

  function applyFilters() {
    const params = new URLSearchParams(searchParams);
    params.delete("page");

    if (minPrice) params.set("minPrice", minPrice);
    else params.delete("minPrice");
    if (maxPrice) params.set("maxPrice", maxPrice);
    else params.delete("maxPrice");

    for (const field of fields) {
      if (field.type === "range") {
        const min = rangeValues[`${field.key}_min`];
        const max = rangeValues[`${field.key}_max`];
        if (min) params.set(`attr_${field.key}_min`, min);
        else params.delete(`attr_${field.key}_min`);
        if (max) params.set(`attr_${field.key}_max`, max);
        else params.delete(`attr_${field.key}_max`);
      } else if (field.type === "checklist") {
        const values = checklistValues[field.key] ?? [];
        if (values.length > 0) params.set(`attr_${field.key}`, values.join(","));
        else params.delete(`attr_${field.key}`);
      } else if (field.type === "toggle") {
        const value = toggleValues[field.key];
        const paramName = paramNameFor(field);
        if (value) params.set(paramName, value);
        else params.delete(paramName);
      } else {
        const value = textValues[field.key];
        if (value) params.set(`attr_${field.key}`, value);
        else params.delete(`attr_${field.key}`);
      }
    }

    const qs = params.toString();
    router.push(qs ? `?${qs}` : "?");
    setMobileOpen(false);
  }

  function clearAll() {
    setMinPrice("");
    setMaxPrice("");
    setRangeValues({});
    setChecklistValues({});
    setToggleValues({});
    setTextValues({});
    router.push("?");
    setMobileOpen(false);
  }

  function handleLocationSelect(name?: string) {
    const target = name ? allDistricts.find((d) => d.name === name) : undefined;
    const params = new URLSearchParams(searchParams);
    params.delete("location");

    if (target) {
      const qs = params.toString();
      router.push(qs ? `/${categorySlug}/${target.slug}?${qs}` : `/${categorySlug}/${target.slug}`);
      return;
    }

    // Not a district -- either a suburb (no dedicated SEO subpage of its own)
    // or a cleared/"All Ghana" selection. A suburb still filters correctly
    // via the plain `location` query param since listings match on it with
    // exact string equality, same as a district does.
    if (name) params.set("location", name);
    const qs = params.toString();
    router.push(qs ? `/${categorySlug}?${qs}` : `/${categorySlug}`);
  }

  const body = (
    <>
      <button
        type="button"
        onClick={() => setLocationOpen(true)}
        className="flex w-full items-center justify-between border-b border-neutral-100 py-3 text-left"
      >
        <span className="text-sm font-semibold text-neutral-700">Location</span>
        <span className="flex items-center gap-1 text-sm font-normal text-neutral-500">
          {locationDisplayName}
          <ChevronRight className="size-4" />
        </span>
      </button>

      <div className="border-b border-neutral-100 py-3">
        <p className="mb-2 text-sm font-semibold text-neutral-700">Price, GH₵</p>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className={FIELD_CLASS}
          />
          <span className="shrink-0 text-neutral-400">–</span>
          <Input
            type="number"
            placeholder="max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className={FIELD_CLASS}
          />
        </div>
      </div>

      {fields.map((field) => {
        const isCollapsed = collapsedKeys[field.key] ?? false;
        return (
          <div key={field.key} className="border-b border-neutral-100 py-1 last:border-b-0">
            <button
              type="button"
              onClick={() => setCollapsedKeys((prev) => ({ ...prev, [field.key]: !isCollapsed }))}
              className="flex w-full items-center justify-between py-2 text-left"
            >
              <span className="text-sm font-semibold text-neutral-700">{field.label}</span>
              <ChevronDown
                className={`size-4 text-neutral-400 transition-transform ${isCollapsed ? "" : "rotate-180"}`}
              />
            </button>

            <AnimatePresence initial={false}>
              {!isCollapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="overflow-hidden"
                >
                  <div className="pb-3">
                    {field.type === "range" && (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          placeholder="min"
                          value={rangeValues[`${field.key}_min`] ?? ""}
                          onChange={(e) =>
                            setRangeValues((v) => ({ ...v, [`${field.key}_min`]: e.target.value }))
                          }
                          className={FIELD_CLASS}
                        />
                        <span className="shrink-0 text-neutral-400">–</span>
                        <Input
                          type="number"
                          placeholder="max"
                          value={rangeValues[`${field.key}_max`] ?? ""}
                          onChange={(e) =>
                            setRangeValues((v) => ({ ...v, [`${field.key}_max`]: e.target.value }))
                          }
                          className={FIELD_CLASS}
                        />
                      </div>
                    )}

                    {field.type === "text" && (
                      <Input
                        type="text"
                        placeholder={`Find ${field.label.toLowerCase()}`}
                        value={textValues[field.key] ?? ""}
                        onChange={(e) => setTextValues((v) => ({ ...v, [field.key]: e.target.value }))}
                        className={FIELD_CLASS}
                      />
                    )}

                    {field.type === "toggle" && (
                      <div className="flex gap-1.5">
                        {(["", "yes", "no"] as ToggleValue[]).map((opt) => (
                          <button
                            key={opt || "any"}
                            type="button"
                            onClick={() => setToggleValues((v) => ({ ...v, [field.key]: opt }))}
                            className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-semibold transition-colors ${
                              (toggleValues[field.key] ?? "") === opt
                                ? "border-brand bg-brand text-white"
                                : "border-neutral-200 text-neutral-600 hover:border-brand/40"
                            }`}
                          >
                            {opt === "" ? "Any" : opt === "yes" ? "Yes" : "No"}
                          </button>
                        ))}
                      </div>
                    )}

                    {field.type === "checklist" && (
                      <ChecklistOptions
                        field={field}
                        selected={checklistValues[field.key] ?? []}
                        searchValue={checklistSearch[field.key] ?? ""}
                        onSearchChange={(value) => setChecklistSearch((s) => ({ ...s, [field.key]: value }))}
                        onToggle={(value) => toggleChecklistValue(field.key, value)}
                      />
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </>
  );

  return (
    <>
      {/* Desktop: sticky sidebar card. Same position in the [category] page's flex
          layout as before -- sticky/self-start is new, so a long field list (Cars
          now has a dozen) scrolls with the page instead of being outrun by the
          results grid. */}
      <div className="hidden w-64 shrink-0 lg:sticky lg:top-20 lg:block lg:self-start">
        <div className="max-h-[calc(100vh-6rem)] overflow-y-auto rounded-xl border border-neutral-300 bg-white p-3 shadow-md">
          <div className="mb-1 flex items-center justify-between">
            <h3 className="text-sm font-bold text-neutral-800">Filters</h3>
            {activeCount > 0 && (
              <button type="button" onClick={clearAll} className="text-xs font-semibold text-brand hover:underline">
                Clear all
              </button>
            )}
          </div>
          {body}
          <Button type="button" onClick={applyFilters} className="mt-3 w-full">
            Apply Filters
          </Button>
        </div>
      </div>

      {/* Mobile: there's no room for a permanent sidebar, so filters live behind a
          floating button and open as a full-screen sheet -- the same
          full-page-on-mobile pattern already used for the location picker and the
          category mega-menu elsewhere in this app. Positioned above the bottom tab
          bar (see BottomTabBar's own height) so the two never overlap. */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed bottom-20 right-4 z-40 flex items-center gap-1.5 rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-lg lg:hidden"
      >
        <SlidersHorizontal className="size-4" />
        Filters
        {activeCount > 0 && (
          <span className="flex size-5 items-center justify-center rounded-full bg-white text-[11px] font-bold text-brand">
            {activeCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "tween", duration: 0.25 }}
            className="fixed inset-0 z-[60] flex flex-col bg-white lg:hidden"
          >
            <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
              <h2 className="text-base font-bold text-neutral-800">Filters</h2>
              <button type="button" onClick={() => setMobileOpen(false)} aria-label="Close filters">
                <X className="size-5 text-neutral-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4">{body}</div>
            <div className="flex gap-2 border-t border-neutral-200 p-4">
              {activeCount > 0 && (
                <Button type="button" variant="outline" onClick={clearAll} className="flex-1">
                  Clear all
                </Button>
              )}
              <Button type="button" onClick={applyFilters} className="flex-1">
                Apply Filters
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <LocationPickerModal open={locationOpen} onClose={() => setLocationOpen(false)} onSelect={handleLocationSelect} />
    </>
  );
}

function ChecklistOptions({
  field,
  selected,
  searchValue,
  onSearchChange,
  onToggle,
}: {
  field: SidebarFilterField;
  selected: string[];
  searchValue: string;
  onSearchChange: (value: string) => void;
  onToggle: (value: string) => void;
}) {
  const options = field.options ?? [];
  const showSearch = options.length > CHECKLIST_SEARCH_THRESHOLD;
  const visible =
    showSearch && searchValue
      ? options.filter((opt) => opt.toLowerCase().includes(searchValue.toLowerCase()))
      : options;

  return (
    <div>
      {showSearch && (
        <div className="relative mb-2">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={`Find ${field.label.toLowerCase()}`}
            className="w-full rounded-lg border border-neutral-200 py-1.5 pl-8 pr-2 text-sm outline-none focus:border-brand"
          />
        </div>
      )}
      <div className="max-h-48 space-y-0.5 overflow-y-auto pr-1">
        {visible.length === 0 && <p className="py-2 text-xs text-neutral-400">No matches.</p>}
        {visible.map((option) => {
          const checked = selected.includes(option);
          return (
            <label
              key={option}
              className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(option)}
                className="size-4 rounded accent-brand"
              />
              <span className="truncate">{option}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
