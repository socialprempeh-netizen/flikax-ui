import Link from "next/link";
import { CategoryThumb } from "@/components/category-thumb";

export type SiblingCategory = { id: string; name: string; slug: string; icon?: string | null };

/** Quick lateral nav between sibling categories: either other leaves under the same
 * parent (on a leaf page), or other top-level categories (on a top-level category
 * page) -- every sibling in one row is always at the same depth as the active
 * category, so a single parentId (the active category's own parent_id) correctly
 * describes the whole set for CategoryThumb's image lookup. */
export function SiblingCategoryRow({
  siblings,
  activeSlug,
  parentId,
}: {
  siblings: SiblingCategory[];
  activeSlug: string;
  parentId: string | null;
}) {
  if (siblings.length === 0) return null;

  return (
    <div className="lg:hidden -mx-4 mb-4 flex gap-3 overflow-x-auto px-4 pb-1">
      {siblings.map((sibling) => {
        const isActive = sibling.slug === activeSlug;
        return (
          <Link key={sibling.id} href={`/${sibling.slug}`} className="flex w-16 shrink-0 flex-col items-center gap-1">
            <CategoryThumb category={{ ...sibling, parent_id: parentId }}
              size="size-12"
              iconSize="size-5"
              rounded="rounded-full"
              sizes="48px"
              eager
              className={isActive ? "ring-2 ring-brand ring-offset-1" : ""}
            />
            <span
              className={`line-clamp-2 text-center text-2xs leading-tight ${
                isActive ? "font-bold text-brand-dark" : "font-medium text-neutral-600"
              }`}
            >
              {sibling.name}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
