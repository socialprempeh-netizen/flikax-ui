import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

// Turns a `listing_images.storage_path` value into a URL an <img> can load.
// Used everywhere listing cards/detail pages render a photo. Passes already-
// absolute URLs through unchanged since some rows predate the storage-bucket
// migration and still hold a full external URL rather than a bucket-relative path.
export function resolveListingImageUrl(supabase: SupabaseClient<Database>, path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return supabase.storage.from("listing-images").getPublicUrl(path).data.publicUrl;
}
