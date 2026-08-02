import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Service-role client: authenticates with the Supabase service key instead
// of a user's session, so every query bypasses RLS entirely. Not part of the
// normal login/session flow -- only for privileged server-side operations
// (admin actions, webhooks) that must act outside a specific user's
// permissions. Never import this into client components; the service key
// must never reach the browser, which is also why it deliberately returns
// null instead of throwing when the env var is absent (so a misconfigured
// preview/dev environment degrades gracefully rather than crashing on import).

/** Server-only. Requires SUPABASE_SERVICE_ROLE_KEY; returns null if not configured. */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) return null;

  return createSupabaseClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
