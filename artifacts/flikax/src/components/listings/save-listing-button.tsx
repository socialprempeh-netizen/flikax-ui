"use client";

import { useEffect, useState, useTransition } from "react";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleSavedListingAction } from "@/app/listings/actions";
import { withAuthRetry } from "@/lib/auth-retry";
import { useSavedListingIds } from "@/lib/use-saved-listing-ids";

// Labeled pill variant for the ad detail page's action column, where there's
// room for a text label and a surfaced error message -- CompactSaveButton is
// the icon-only variant used as a grid-card overlay, where there isn't.
// Both call the same toggleSavedListingAction; this one isn't a wrapper
// around that component because the detail page's error UI (the <p> below)
// has nowhere equivalent to render inside a small floating circle.
export function SaveListingButton({ listingId }: { listingId: string }) {
  const savedIds = useSavedListingIds();
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // See CompactSaveButton for why this guard exists.
  const [hasToggled, setHasToggled] = useState(false);

  useEffect(() => {
    if (!hasToggled) setSaved(savedIds.has(listingId));
  }, [savedIds, listingId, hasToggled]);

  function toggle() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await withAuthRetry(() => toggleSavedListingAction(listingId));
        setHasToggled(true);
        setSaved(result.saved);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save this listing.");
      }
    });
  }

  return (
    <Button
      type="button"
      onClick={toggle}
      disabled={isPending}
      aria-label={saved ? "Remove from saved" : "Save listing"}
      aria-pressed={saved}
      title={error ?? undefined}
      variant="outline"
      size="sm"
      className={`h-11 rounded-full ${
        error
          ? "border-red-200 text-red-500 hover:bg-red-50"
          : saved
            ? "border-brand bg-brand-light text-brand hover:bg-brand-light"
            : "text-neutral-700"
      }`}
    >
      <Bookmark className={`size-4 ${saved ? "fill-brand" : ""}`} />
      {saved ? "Saved" : "Save"}
    </Button>
  );
}
