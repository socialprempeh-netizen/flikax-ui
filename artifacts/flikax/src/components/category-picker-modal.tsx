"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { CategoryThumb } from "@/components/category-thumb";

export type PickableCategory = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
};

/** Category/subcategory picker for the post-ad wizard, styled to match
 * LocationPickerModal's quality bar (full-page takeover on mobile, visible
 * neutral-300 dividers, generous row spacing, aligned icons) -- previously
 * this step used a pair of plain <select> dropdowns, which is where the
 * "no dividers, cramped, unstyled" complaints about the category list came
 * from once it was rebuilt to look like this reference.
 *
 * Every category in this app is exactly two levels deep (verified in
 * mobile-category-list.tsx's own comment: no leaf category ever has
 * children of its own), so this only ever needs one level of drill-down --
 * tap a top-level category, pick a subcategory, done. Unlike
 * LocationPickerModal there's no "All X" broad-selection shortcut and no
 * search box: a listing always needs a concrete leaf category, and the
 * top-level list is short enough (a dozen or so) that search isn't earning
 * its keep here the way it does for Ghana's full region/district/suburb
 * tree. */
export function CategoryPickerModal({
  open,
  onClose,
  categories,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  categories: PickableCategory[];
  onSelect: (category: PickableCategory) => void;
}) {
  const [activeParentId, setActiveParentId] = useState<string | null>(null);

  const parents = categories.filter((c) => c.parent_id === null);
  const activeParent = parents.find((p) => p.id === activeParentId) ?? null;
  const children = activeParent ? categories.filter((c) => c.parent_id === activeParent.id) : [];

  function close() {
    onClose();
    setActiveParentId(null);
  }

  function selectCategory(category: PickableCategory) {
    onSelect(category);
    close();
  }

  if (!open) return null;

  return (
    // Same full-page-on-mobile / centered-dialog-on-desktop shell as
    // LocationPickerModal, for a consistent "picker" feel across the form.
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-white sm:items-center sm:justify-center sm:bg-neutral-900/70 sm:p-4"
      onClick={close}
    >
      <div
        className="flex h-full w-full flex-col overflow-hidden bg-white sm:h-auto sm:max-h-[75vh] sm:w-full sm:max-w-lg sm:shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-neutral-300 px-4 py-3">
          {activeParent ? (
            <button
              type="button"
              onClick={() => setActiveParentId(null)}
              className="flex shrink-0 cursor-pointer items-center gap-1 px-2 py-1 text-base font-medium text-neutral-700 hover:bg-neutral-50 hover:text-brand-dark"
            >
              <ChevronLeft className="size-4" />
              Back
            </button>
          ) : (
            <span className="shrink-0 text-base font-bold text-neutral-800">Select category</span>
          )}

          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="ml-auto flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
          >
            <X className="size-4.5" />
          </button>
        </div>

        <div className="overflow-y-auto">
          {activeParent ? (
            <div className="flex flex-col">
              <div className="border-b border-neutral-300 px-4 py-2.5 text-sm font-semibold text-brand-dark">
                {activeParent.name}
              </div>
              {children.map((child) => (
                <button
                  key={child.id}
                  type="button"
                  onClick={() => selectCategory(child)}
                  className="flex w-full cursor-pointer items-center gap-3 border-b border-neutral-300 px-4 py-4 text-left transition-colors last:border-b-0 hover:bg-neutral-50"
                >
                  <CategoryThumb
                    category={child}
                    size="size-10"
                    iconSize="size-5"
                    rounded="rounded-full"
                    sizes="40px"
                  />
                  <span className="min-w-0 flex-1 text-base font-medium text-neutral-800">{child.name}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col">
              {parents.map((parent) => (
                <button
                  key={parent.id}
                  type="button"
                  onClick={() => setActiveParentId(parent.id)}
                  className="flex w-full cursor-pointer items-center gap-3 border-b border-neutral-300 px-4 py-4 text-left transition-colors last:border-b-0 hover:bg-neutral-50"
                >
                  <CategoryThumb
                    category={parent}
                    size="size-10"
                    iconSize="size-5"
                    rounded="rounded-full"
                    sizes="40px"
                  />
                  <span className="min-w-0 flex-1 text-base font-medium text-neutral-800">{parent.name}</span>
                  <ChevronRight className="size-4 shrink-0 text-neutral-400" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
