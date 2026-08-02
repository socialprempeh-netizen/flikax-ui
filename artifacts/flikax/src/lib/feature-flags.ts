import { createClient } from "@/lib/supabase/server";

// Simple on/off flags (e.g. the "maintenance_mode" key), editable at
// /admin/settings and read wherever a feature needs to be toggled without a
// deploy -- e.g. /premium page. Note: middleware.ts's own maintenance-mode
// check does NOT go through this file -- middleware runs on the Edge runtime
// before the SSR Supabase client is available, so it hits the
// feature_flags REST endpoint directly instead.
export type FeatureFlag = {
  key: string;
  enabled: boolean;
  description: string | null;
  updated_at: string;
};

/** Defaults to false if the flag row doesn't exist yet. */
export async function getFeatureFlag(key: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase.from("feature_flags").select("enabled").eq("key", key).maybeSingle();
  return data?.enabled ?? false;
}

export async function getAllFeatureFlags(): Promise<FeatureFlag[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("feature_flags").select("*").order("key");
  return data ?? [];
}
