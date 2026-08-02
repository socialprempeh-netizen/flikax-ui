import { createClient } from "@/lib/supabase/server";

// Global key/value settings row (site name, contact info, etc.) editable at
// /admin/settings and read on public pages like /contact. A single flat
// table rather than one column per setting so new settings don't need a
// migration -- getSiteSetting reads one key for a page that only needs one
// value, getAllSiteSettings backs the admin settings form.
export type SiteSetting = {
  key: string;
  value: string | null;
  description: string | null;
  updated_at: string;
};

export async function getSiteSetting(key: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("site_settings").select("value").eq("key", key).maybeSingle();
  return data?.value ?? null;
}

export async function getAllSiteSettings(): Promise<SiteSetting[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("site_settings").select("*").order("key");
  return data ?? [];
}
