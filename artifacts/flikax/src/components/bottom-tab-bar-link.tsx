"use client";

import Link from "next/link";
import { useAuthModal } from "@/components/auth/auth-modal-provider";

export function BottomTabLink({
  href,
  gated,
  isActive,
  label,
  icon,
  showUnreadDot,
}: {
  href: string;
  gated: boolean;
  isActive: boolean;
  label: string;
  // Pre-rendered by the server caller (e.g. `<Home className="size-5" />`)
  // rather than a bare component reference -- a Server Component can only
  // pass a Client Component an already-rendered element as a prop, not a
  // raw function for the client to call itself.
  icon: React.ReactNode;
  showUnreadDot: boolean;
}) {
  const { openAuthModal } = useAuthModal();
  const className = `relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
    isActive ? "text-brand" : "text-neutral-500"
  }`;

  if (gated) {
    return (
      <button type="button" onClick={() => openAuthModal(href)} className={className}>
        {icon}
        {label}
      </button>
    );
  }

  return (
    <Link href={href} className={className}>
      {icon}
      {label}
      {showUnreadDot && <span className="absolute right-1/3 top-1 size-2 rounded-full bg-red-500" />}
    </Link>
  );
}
