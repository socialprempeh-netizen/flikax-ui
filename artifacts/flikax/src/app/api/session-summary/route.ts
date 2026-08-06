import { NextResponse } from "next/server";
import { createClient, getUser } from "@/lib/supabase/server";
import { getInitials } from "@/lib/avatar";
import { isConversationUnread } from "@/lib/messages";

// Backs useSessionSummary() (src/lib/use-session-summary.ts), the client
// hook the header/nav use to know whether someone's logged in. This is
// where the actual getUser() call and unread-messages query happen.
//
// Reads cookies(), so this route itself is always dynamic -- that's expected
// and fine for a route handler. The point of splitting it out of SiteHeader
// is that a *page* rendering SiteHeader no longer needs to touch cookies()
// in its own render path, so the page itself stays static/ISR-eligible.
// The header fetches this client-side after the cached shell has painted.
export async function GET() {
  const { data } = await getUser();
  const user = data.user;

  if (!user) {
    return NextResponse.json({
      isLoggedIn: false,
      userId: undefined,
      avatarUrl: undefined,
      initials: undefined,
      hasUnreadMessages: false,
    });
  }

  const meta = (user.user_metadata ?? {}) as { avatar_url?: string; full_name?: string; name?: string };

  const supabase = await createClient();
  const [{ data: conversations }, { data: profile }] = await Promise.all([
    supabase
      .from("conversations")
      .select("buyer_id, seller_id, last_message_at, last_read_by_buyer_at, last_read_by_seller_at")
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`),
    // Own row -- allowed by the "Users can view own profile" RLS policy
    // regardless of what the header shows for anyone else.
    supabase.from("profiles").select("avatar_url").eq("id", user.id).maybeSingle(),
  ]);
  const hasUnreadMessages = (conversations ?? []).some((c) => isConversationUnread(c, user.id));

  return NextResponse.json(
    {
      isLoggedIn: true,
      userId: user.id,
      // A deliberately-uploaded photo (profiles.avatar_url) wins over
      // whatever generic picture the OAuth provider handed back at signup
      // -- the OAuth one is only a fallback for someone who's never
      // uploaded their own.
      avatarUrl: profile?.avatar_url || meta.avatar_url,
      initials: getInitials(meta.full_name || meta.name || undefined),
      hasUnreadMessages,
    },
    { headers: { "Cache-Control": "private, max-age=5, stale-while-revalidate=10" } }
  );
}
