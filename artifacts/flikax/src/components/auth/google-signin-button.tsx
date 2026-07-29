"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { GoogleIcon } from "@/components/icons/social-icons";
import { Button } from "@/components/ui/button";

export function GoogleSignInButton({ redirectTo = "/" }: { redirectTo?: string }) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
      },
    });
  }

  return (
    <Button type="button" onClick={handleClick} disabled={loading} variant="outline" size="lg" className="w-full rounded-2xl shadow-sm">
      <GoogleIcon className="size-4.5" aria-hidden="true" />
      {loading ? "Redirecting..." : "Continue with Google"}
    </Button>
  );
}
