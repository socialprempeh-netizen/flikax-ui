"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function LogoutButton({
  className = "px-3 py-1.5 text-sm font-medium text-white hover:bg-white/10 disabled:opacity-60",
}: {
  // Default className assumes a dark/translucent parent (header, drawer) --
  // callers on a light background (e.g. inside a white dropdown) always
  // override this rather than the component branching on a "variant" prop.
  className?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    // router.refresh() alone isn't enough here: pushing to "/" first
    // guarantees we land somewhere that never required auth, so a refresh
    // of a page that DID require it (e.g. /dashboard) can't momentarily
    // re-render mid-redirect with now-stale, logged-in-shaped server data.
    router.push("/");
    router.refresh();
  }

  return (
    <Button type="button" onClick={handleLogout} disabled={loading} variant="ghost" className={className}>
      {loading ? "Logging out..." : "Log out"}
    </Button>
  );
}
