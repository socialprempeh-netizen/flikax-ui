"use client";

import Link from "next/link";
import { MessageSquare, Bell, Gem, ClipboardList, UserRound, UserPlus, Plus } from "lucide-react";
import { useSessionSummary } from "@/lib/use-session-summary";
import { useAuthModal } from "@/components/auth/auth-modal-provider";
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
          header itself only needs one action -- sign up when logged out,
          or the account avatar when logged in. Desktop keeps the full row. */}
      <div className="flex items-center gap-1.5 sm:hidden">
        {isLoggedIn ? (
          <Link
            href="/settings"
            title="My Account"
            aria-label="My Account"
            className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            {avatar}
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => openAuthModal("/")}
            className="flex items-center gap-1.5 rounded-full bg-brand px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-dark"
          >
            <UserPlus className="size-4" />
            Sign up
          </button>
        )}
      </div>

      <div className="hidden items-center gap-1.5 sm:flex sm:gap-3">
        <GatedIconLink
          href="/messages"
          gated={!isLoggedIn}
          onOpenModal={() => openAuthModal("/messages")}
          title="Messages"
          className="relative flex size-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:size-10"
        >
          <MessageSquare className="size-4 sm:size-5" />
          {hasUnreadMessages && (
            <span className="absolute right-1 top-1 size-2 rounded-full bg-red-500 ring-2 ring-white" />
          )}
        </GatedIconLink>

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
          className="flex size-9 items-center justify-center overflow-hidden rounded-full bg-white/10 text-white hover:bg-white/20 sm:size-10"
        >
          {avatar}
        </GatedIconLink>

        <Button asChild size="lg" className="rounded-full px-5 font-bold shadow-sm">
          <Link href="/sell">
            <Plus className="size-4" />
            Post Ad
          </Link>
        </Button>
      </div>
    </>
  );
}
