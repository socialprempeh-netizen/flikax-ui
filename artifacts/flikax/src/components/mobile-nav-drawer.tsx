"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Menu,
  Bookmark,
  MessageSquare,
  ClipboardList,
  Gem,
  LifeBuoy,
  LogIn,
} from "lucide-react";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { LogoutButton } from "@/components/auth/logout-button";
import { useAuthModal } from "@/components/auth/auth-modal-provider";
import { useMessagesModal } from "@/components/messages/messages-modal-provider";
import { useSessionSummary } from "@/lib/use-session-summary";

// No Settings entry here -- it's redundant with the account avatar in the
// header (mobile HeaderUserActions), which already links to /settings.
const ACCOUNT_LINKS = [
  { label: "Saved", href: "/saved", icon: Bookmark },
  { label: "Messages", href: "/messages", icon: MessageSquare },
  { label: "My Ads", href: "/dashboard", icon: ClipboardList },
  { label: "Premium Plans", href: "/premium", icon: Gem },
  { label: "Help & Support", href: "/contact", icon: LifeBuoy },
];

// No category links here -- the homepage's category icon grid is the one
// place to browse categories, so this drawer only holds account pages
// that have nowhere else to live on mobile.
export function MobileNavDrawer() {
  const [open, setOpen] = useState(false);
  const { isLoggedIn, hasUnreadMessages } = useSessionSummary();
  const { openAuthModal } = useAuthModal();
  const { openMessages } = useMessagesModal();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Open menu"
          className="flex size-11 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 lg:hidden"
        >
          <Menu className="size-5" />
        </button>
      </SheetTrigger>

      <SheetContent side="left" className="lg:hidden">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <nav className="mt-2 flex flex-col">
            {ACCOUNT_LINKS.map((item) => (
              <SheetClose asChild key={item.href}>
                {isLoggedIn && item.href === "/messages" ? (
                  <button
                    type="button"
                    onClick={openMessages}
                    className="relative flex items-center gap-3 rounded-lg px-2 py-2.5 text-left text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                  >
                    <item.icon className="size-4.5 shrink-0 text-neutral-600" />
                    {item.label}
                    {hasUnreadMessages && <span className="size-2 rounded-full bg-red-500" />}
                  </button>
                ) : isLoggedIn ? (
                  <Link
                    href={item.href}
                    className="relative flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                  >
                    <item.icon className="size-4.5 shrink-0 text-neutral-600" />
                    {item.label}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => openAuthModal(item.href)}
                    className="relative flex items-center gap-3 rounded-lg px-2 py-2.5 text-left text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                  >
                    <item.icon className="size-4.5 shrink-0 text-neutral-600" />
                    {item.label}
                  </button>
                )}
              </SheetClose>
            ))}
          </nav>

          <div className="mt-3 border-t border-neutral-100 pt-3">
            {isLoggedIn ? (
              <LogoutButton className="w-full rounded-lg px-2 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50" />
            ) : (
              <SheetClose asChild>
                <button
                  type="button"
                  onClick={() => openAuthModal("/")}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left text-sm font-medium text-brand hover:bg-brand-light"
                >
                  <LogIn className="size-4.5 shrink-0" />
                  Log in
                </button>
              </SheetClose>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
