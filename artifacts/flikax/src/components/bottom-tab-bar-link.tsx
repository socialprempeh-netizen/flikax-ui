"use client";

import Link from "next/link";
import { useAuthModal } from "@/components/auth/auth-modal-provider";
import { useMessagesModal } from "@/components/messages/messages-modal-provider";

export function BottomTabLink({
  href,
  gated,
  isActive,
  label,
  icon,
  showUnreadDot,
  opensMessagesModal = false,
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
  // The Messages tab opens the floating inbox instead of navigating, same
  // as the header's Messages icon -- only meaningful when !gated (a gated
  // tap already opens the auth modal instead).
  opensMessagesModal?: boolean;
}) {
  const { openAuthModal } = useAuthModal();
  const { openMessages } = useMessagesModal();
  const className = `relative flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-semibold ${
    isActive ? "text-brand-dark" : "text-neutral-700"
  }`;

  if (gated) {
    return (
      <button type="button" onClick={() => openAuthModal(href)} className={className}>
        {icon}
        {label}
      </button>
    );
  }

  if (opensMessagesModal) {
    return (
      <button type="button" onClick={openMessages} className={className}>
        {icon}
        {label}
        {showUnreadDot && <span className="absolute right-1/3 top-1 size-2 rounded-full bg-red-500" />}
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
