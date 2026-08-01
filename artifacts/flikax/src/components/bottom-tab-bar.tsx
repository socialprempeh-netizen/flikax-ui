import { Home, Bookmark, SquarePlus, MessageSquare, User } from "lucide-react";
import { createClient, getUser } from "@/lib/supabase/server";
import { isConversationUnread } from "@/lib/messages";
import { BottomTabLink } from "@/components/bottom-tab-bar-link";

const TABS = [
  { label: "Home", href: "/", icon: Home },
  { label: "Saved", href: "/saved", icon: Bookmark },
  { label: "Sell", href: "/sell", icon: SquarePlus },
  { label: "Messages", href: "/messages", icon: MessageSquare },
  { label: "Profile", href: "/dashboard", icon: User },
] as const;

/**
 * Global mobile-only bottom nav. Self-contained (fetches its own auth/unread
 * state) rather than taking props, matching how SiteHeader already does the
 * same thing -- every page that wants it just drops in <BottomTabBar />.
 */
export async function BottomTabBar({ activeHref }: { activeHref: string }) {
  const {
    data: { user },
  } = await getUser();
  const isLoggedIn = Boolean(user);

  let hasUnreadMessages = false;
  if (user) {
    const supabase = await createClient();
    const { data: conversations } = await supabase
      .from("conversations")
      .select("buyer_id, seller_id, last_message_at, last_read_by_buyer_at, last_read_by_seller_at")
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);
    hasUnreadMessages = (conversations ?? []).some((c) => isConversationUnread(c, user.id));
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-neutral-200 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.04)] pb-[env(safe-area-inset-bottom)] lg:hidden">
      {TABS.map((tab) => (
        <BottomTabLink
          key={tab.label}
          href={tab.href}
          label={tab.label}
          icon={<tab.icon className="size-[22px]" strokeWidth={2.4} />}
          isActive={tab.href === activeHref}
          gated={tab.href !== "/" && !isLoggedIn}
          showUnreadDot={tab.href === "/messages" && hasUnreadMessages}
          opensMessagesModal={tab.href === "/messages"}
        />
      ))}
    </nav>
  );
}
