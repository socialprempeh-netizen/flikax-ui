"use client";

import Link from "next/link";
import { useSessionSummary } from "@/lib/use-session-summary";
import { useAuthModal } from "@/components/auth/auth-modal-provider";

// Single source of truth for every "Sell / Post an Ad / Create Listing"-style
// call to action across the site. If the post-listing route ever moves,
// update SELL_ROUTE here instead of hunting down every hardcoded link.
const SELL_ROUTE = "/sell";

// solid: bg-brand-dark, not bg-brand -- white text on #149777 is 3.67:1,
// below WCAG AA's 4.5:1 floor; brand-dark clears it at 6.04:1. Same call as
// --primary in globals.css. Border/outline keeps the vivid --brand (borders
// only need 3:1), but its text is brand-dark for the same reason.
const VARIANT_CLASSES = {
  solid: "bg-brand-dark text-white hover:brightness-110",
  outline: "border-2 border-brand text-brand-dark hover:bg-brand-light",
  footer: "bg-white/10 text-white hover:bg-white/20",
};

const SIZE_CLASSES = {
  sm: "min-h-11 px-3 py-2 text-sm",
  md: "min-h-11 px-4 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
};

export function SellCta({
  label = "Post an Ad",
  variant = "solid",
  size = "md",
  // Pre-rendered by the caller (e.g. `icon={<PencilLine className="size-4" />}`)
  // rather than a bare component reference -- a Server Component caller can
  // only pass this Client Component an already-rendered element as a prop,
  // not a raw function for the client to call itself.
  icon,
  className = "",
}: {
  label?: string;
  variant?: keyof typeof VARIANT_CLASSES;
  size?: keyof typeof SIZE_CLASSES;
  icon?: React.ReactNode;
  className?: string;
}) {
  // /sell itself gates on the server with a hard redirect() -- fine for a
  // direct link, but landing a logged-out click there means a full page
  // navigation to /auth/login instead of the floating modal. Checking here
  // first keeps that click on the current page, matching every other
  // sign-in entry point in the header/nav.
  const { isLoggedIn } = useSessionSummary();
  const { openAuthModal } = useAuthModal();
  const sharedClassName = `inline-flex items-center justify-center gap-2 font-bold transition-colors ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`;

  if (!isLoggedIn) {
    return (
      <button type="button" onClick={() => openAuthModal(SELL_ROUTE)} className={sharedClassName}>
        {icon}
        {label}
      </button>
    );
  }

  return (
    <Link href={SELL_ROUTE} className={sharedClassName}>
      {icon}
      {label}
    </Link>
  );
}
