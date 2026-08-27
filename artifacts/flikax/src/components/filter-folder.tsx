"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

/** Collapsible card wrapper reused across the sidebar's filter sections
 * (Price, and each dynamic per-category field) -- header toggles the body
 * open/closed, closing just stops rendering it rather than animating it
 * out, since nothing here needs the height-transition treatment.
 *
 * Sized off the reference marketplace's own equivalent accordion row
 * (.b-filter-attribute__name / .b-toggle): min-h-[50px] on the header and
 * size-6 (24px) on the toggle icon are exact matches, not rounded
 * approximations. No rounded-lg here -- this codebase's own square-corners
 * rule (see DESIGN_SYSTEM.md) applies to every box/container, and this one
 * had drifted from it. The reference's own icon is a literal chevron that
 * flips direction with open/closed state (not a static hamburger, which is
 * what this rendered before) -- ChevronDown/ChevronUp matches both its
 * shape and that behavior. */
export function FilterFolder({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const ToggleIcon = isOpen ? ChevronUp : ChevronDown;

  return (
    <div className="mb-4 border border-gray-100 bg-white p-4 shadow-sm">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        className="flex min-h-[50px] w-full cursor-pointer items-center justify-between"
      >
        <span className="text-sm font-bold text-neutral-800">{title}</span>
        <ToggleIcon className="size-6 shrink-0 text-[#2EB8A0]" />
      </button>
      {isOpen && <div className="mt-3">{children}</div>}
    </div>
  );
}
