"use client";

import { useState } from "react";
import { Menu } from "lucide-react";

/** Collapsible card wrapper reused across the sidebar's filter sections
 * (Price, and each dynamic per-category field) -- header toggles the body
 * open/closed, closing just stops rendering it rather than animating it
 * out, since nothing here needs the height-transition treatment. */
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

  return (
    <div className="mb-4 rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        className="flex w-full cursor-pointer items-center justify-between"
      >
        <span className="text-sm font-bold text-neutral-800">{title}</span>
        <Menu className="size-4 shrink-0 text-[#2EB8A0]" />
      </button>
      {isOpen && <div className="mt-3">{children}</div>}
    </div>
  );
}
