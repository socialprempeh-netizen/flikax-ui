import Link from "next/link";
import type { Category } from "@/components/category-sidebar";
import { CategoryThumb } from "@/components/category-thumb";

/** Homepage category browser: every top-level category as a round icon with
 * its name below (Temu/Tonaton-style), wrapping to as many rows as needed so
 * every category is always visible -- nothing hidden behind a separate "All
 * categories" control or a flyout menu. Each icon links straight to that
 * category's own real route (`/vehicles`, `/property`, ...) -- the same
 * [category]/page.tsx template a leaf like `/cars` already uses, just keyed
 * one level up (see the topLevelSlug/leafSlug branching there), not a
 * `?category=` query param scoped to the homepage. */
export function CategoryIconGrid({
  categories,
  selectedSlug,
}: {
  categories: Category[];
  selectedSlug?: string;
}) {
  const parents = categories.filter((c) => c.parent_id === null);

  return (
    <div className="flex flex-wrap gap-x-0.5 gap-y-2.5 sm:gap-x-1">
      {parents.map((cat) => {
        const isActive = cat.slug === selectedSlug;
        return (
          <Link
            key={cat.id}
            href={`/${cat.slug}`}
            title={cat.name}
            className="group flex w-[62px] shrink-0 flex-col items-center gap-1 rounded-lg p-1 text-center transition-colors hover:bg-neutral-100 sm:w-[76px]"
          >
            <CategoryThumb
              category={cat}
              size="size-12 sm:size-14"
              iconSize="size-5 sm:size-6"
              rounded="rounded-full"
              sizes="56px"
              eager
              className={`shadow-sm ring-2 transition-all group-hover:scale-105 group-hover:shadow-md ${
                isActive ? "ring-brand" : "ring-white group-hover:ring-brand/30"
              }`}
            />
            <span
              className={`line-clamp-2 text-2xs font-medium leading-tight transition-colors sm:text-xs ${
                isActive ? "text-brand-dark" : "text-neutral-700 group-hover:text-brand-dark"
              }`}
            >
              {cat.name}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
