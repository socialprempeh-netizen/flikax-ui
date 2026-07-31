"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { buildListingsHref, type ListingFilters } from "@/lib/filters";
import type { Category } from "@/components/category-sidebar";
import { CategoryThumb } from "@/components/category-thumb";
import { useSessionSummary } from "@/lib/use-session-summary";
import { useAuthModal } from "@/components/auth/auth-modal-provider";

export function MobileCategoryGrid({
  parents,
  filters,
}: {
  parents: Category[];
  filters: ListingFilters;
}) {
  const { isLoggedIn } = useSessionSummary();
  const { openAuthModal } = useAuthModal();

  const postAdTile = (
    <>
      <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand text-white">
        <Plus className="size-5" />
      </span>
      <span className="line-clamp-2 text-[11px] font-semibold leading-tight text-neutral-800">
        Post an Ad
      </span>
    </>
  );

  return (
    <div className="grid grid-cols-4 gap-x-1.5 gap-y-3">
      {isLoggedIn ? (
        <Link href="/sell" className="flex min-h-14 flex-col items-center justify-start gap-1 text-center">
          {postAdTile}
        </Link>
      ) : (
        <button
          type="button"
          onClick={() => openAuthModal("/sell")}
          className="flex min-h-14 flex-col items-center justify-start gap-1 text-center"
        >
          {postAdTile}
        </button>
      )}

      {parents.map((cat) => (
        <Link
          key={cat.id}
          href={buildListingsHref({ ...filters, category: cat.slug })}
          className="flex min-h-14 flex-col items-center justify-start gap-1 text-center"
        >
          <CategoryThumb category={cat} size="size-12" iconSize="size-5" rounded="rounded-full" sizes="48px" />
          <span className="line-clamp-2 text-[11px] font-medium leading-tight text-neutral-700">
            {cat.name}
          </span>
        </Link>
      ))}
    </div>
  );
}
