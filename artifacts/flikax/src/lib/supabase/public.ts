import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Not part of the login/OAuth/OTP flow itself -- this client never reads a
// session, so it always queries as an anonymous visitor regardless of who's
// actually signed in. It exists purely to avoid the cost below.
//
// The cookie-aware client in server.ts calls cookies() unconditionally --
// which is correct for anything that needs to respect a signed-in viewer's
// session, but it also means *any* page that uses it for even a plain public
// query (categories, active listings) gets forced out of static/ISR
// rendering, since cookies() access is a Next.js "dynamic API".
//
// This client uses the same anon key (so it's bound by the exact same RLS
// policies an anonymous visitor gets -- not the service-role admin client)
// but never touches cookies(). Use it only for the public, non-personalized
// data on ISR'd pages (homepage, category pages, listing detail): the
// rendered HTML is shared across every visitor by definition, so it can
// only ever reflect what an anonymous/logged-out viewer would see anyway.
// Anything that genuinely depends on who's looking (saved state, "is this
// my listing", unread badges) must be fetched client-side instead -- see
// useSessionSummary for the equivalent pattern already used in the header.
export function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    // Return a no-op client when secrets aren't configured yet.
    // Pages that depend on live data will show empty states until secrets are added.
    return {
      from: () => ({ select: async () => ({ data: [], error: null }), rpc: async () => ({ data: [], error: null }) }),
      rpc: async () => ({ data: [], error: null }),
      storage: { from: () => ({ getPublicUrl: () => ({ data: { publicUrl: "" } }) }) },
    } as unknown as ReturnType<typeof createSupabaseClient<Database>>;
  }
  return createSupabaseClient<Database>(
    url,
    key,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
