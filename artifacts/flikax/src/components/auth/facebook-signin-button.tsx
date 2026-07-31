"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { FacebookIcon } from "@/components/icons/social-icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FacebookSignInButton({
  redirectTo = "/",
  compact = false,
  className,
}: {
  redirectTo?: string;
  compact?: boolean;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "facebook",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
      },
    });
  }

  return (
    <Button
      type="button"
      onClick={handleClick}
      disabled={loading}
      variant="outline"
      className={cn(
        "h-11 w-full min-w-0 !shrink rounded-xl border-slate-300 bg-neutral-100 text-sm font-semibold text-neutral-800 shadow-sm transition-all hover:border-slate-400 hover:bg-neutral-200",
        className
      )}
    >
      <FacebookIcon className="size-4.5" aria-hidden="true" />
      {loading ? "..." : compact ? "Facebook" : "Continue with Facebook"}
    </Button>
  );
}
