"use client";

import Link from "next/link";
import { MessageSquare, Bell, Gem, ClipboardList, UserRound, Plus } from "lucide-react";
import { useSessionSummary } from "@/lib/use-session-summary";
import { useAuthModal } from "@/components/auth/auth-modal-provider";
import { useMessagesModal } from "@/components/messages/messages-modal-provider";
import { Button } from "@/components/ui/button";

// Renders a real <Link> when a destination is reachable, or a button that
// opens the auth modal (remembering the intended destination as
// redirectTo) when it isn't -- so logged-out visitors get the floating
// sign-in overlay instead of being yanked to a full-page route.
function GatedIconLink({
  href,
  gated,
  onOpenModal,
  className,
  title,
  children,
}: {
  href: string;
  gated: boolean;
  onOpenModal: () => void;
  className: string;
  title: string;
  children: React.ReactNode;
}) {
  if (gated) {
    return (
      <button type="button" onClick={onOpenModal} title={title} aria-label={title} className={className}>
        {children}
      </button>
    );
  }
  return (
    <Link href={href} title={title} aria-label={title} className={className}>
      {children}
    </Link>
  );
}

// Split out of SiteHeader so the auth-dependent icons (which need cookies())
// don't force every page that renders the header into dynamic rendering --
// see useSessionSummary for the fetch/caching behavior and its tradeoff.
export function HeaderUserActions() {
  const { isLoggedIn, avatarUrl, initials, hasUnreadMessages } = useSessionSummary();
  const { openAuthModal } = useAuthModal();
  const { openMessages } = useMessagesModal();

  const avatar = avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={avatarUrl} alt="" className="size-full object-cover" />
  ) : initials ? (
    <span className="text-xs font-bold sm:text-sm">{initials}</span>
  ) : (
    <UserRound className="size-4 sm:size-5" />
  );

  return (
    <>
      {/* Mobile: everything else lives in the hamburger drawer already, so the
          header itself only needs the account avatar (logged in) plus the
          same yellow Post Ad CTA as desktop. This used to be a "Sign up"
          button that forced openAuthModal(..., "register") -- skipping
          straight to the expanded create-account form and, being the site's
          one non-brand button, rendering in --brand instead of yellow.
          Post Ad here calls openAuthModal(SELL_ROUTE) with no mode override,
          same as the desktop button and the Sell bottom-tab, so a logged-out
          tap opens the compact sign-in chooser first, not the register form. */}
      <div className="flex items-center gap-1.5 sm:hidden">
        {isLoggedIn && (
          <Link
            href="/settings"
            title="My Account"
            aria-label="My Account"
            className="flex size-11 items-center justify-center overflow-hidden rounded-full bg-white/10 text-white ring-2 ring-white/25 hover:bg-white/20"
          >
            {avatar}
          </Link>
        )}

        {isLoggedIn ? (
          <Button asChild size="sm" className="h-9 rounded-none bg-[#FFC800] px-3 text-xs font-bold text-black shadow-sm hover:bg-[#e6b400]">
            <Link href="/sell">
              <Plus className="size-3.5" />
              Post Ad
            </Link>
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            className="h-9 rounded-none bg-[#FFC800] px-3 text-xs font-bold text-black shadow-sm hover:bg-[#e6b400]"
            onClick={() => openAuthModal("/sell")}
          >
            <Plus className="size-3.5" />
            Post Ad
          </Button>
        )}
      </div>

      <div className="hidden items-center gap-1.5 sm:flex sm:gap-3">
        <button
          type="button"
          onClick={() => (isLoggedIn ? openMessages() : openAuthModal("/messages"))}
          title="Messages"
          aria-label="Messages"
          className="relative flex size-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:size-10"
        >
          <MessageSquare className="size-4 sm:size-5" />
          {hasUnreadMessages && (
            <span className="absolute right-1 top-1 size-2 rounded-full bg-red-500 ring-2 ring-white" />
          )}
        </button>

        <GatedIconLink
          href="/notifications"
          gated={!isLoggedIn}
          onOpenModal={() => openAuthModal("/notifications")}
          title="Notifications"
          className="flex size-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:size-10"
        >
          <Bell className="size-4 sm:size-5" />
        </GatedIconLink>

        <Link
          href="/premium"
          title="Premium"
          aria-label="Premium"
          className="flex size-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:size-10"
        >
          <Gem className="size-4 sm:size-5" />
        </Link>

        <GatedIconLink
          href="/dashboard"
          gated={!isLoggedIn}
          onOpenModal={() => openAuthModal("/dashboard")}
          title="My Adverts"
          className="flex size-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:size-10"
        >
          <ClipboardList className="size-4 sm:size-5" />
        </GatedIconLink>

        <GatedIconLink
          href="/settings"
          gated={!isLoggedIn}
          onOpenModal={() => openAuthModal("/")}
          title="My Account"
          className="flex items-center gap-2 rounded-full bg-white/10 py-1 pl-1 pr-3 text-white hover:bg-white/20"
        >
          <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/15 ring-2 ring-white/25">
            {avatar}
          </span>
          <span className="text-sm font-medium">Account</span>
        </GatedIconLink>

        {/* Post Ad is the one deliberate exception to the site's single-brand-
            color accent system -- stays yellow (#FFC800, was orange)
            regardless of --brand so it keeps reading as the primary
            conversion action. Black text/icon (not white): white on
            #FFC800 measures 1.55:1, badly failing WCAG's 3:1 floor even for
            large text/icons -- black clears it at 11.54:1. */}
        {isLoggedIn ? (
          <Button
            asChild
            size="lg"
            className="rounded-none bg-[#FFC800] px-5 font-bold text-black shadow-sm hover:bg-[#e6b400]"
          >
            <Link href="/sell">
              <Plus className="size-4" />
              Post Ad
            </Link>
          </Button>
        ) : (
          <Button
            type="button"
            size="lg"
            className="rounded-none bg-[#FFC800] px-5 font-bold text-black shadow-sm hover:bg-[#e6b400]"
            onClick={() => openAuthModal("/sell")}
          >
            <Plus className="size-4" />
            Post Ad
          </Button>
        )}
      </div>
    </>
  );
}
