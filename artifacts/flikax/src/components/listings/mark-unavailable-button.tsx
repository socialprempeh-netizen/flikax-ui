"use client";

import { useState, useTransition } from "react";
import { CircleOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markListingUnavailableAction } from "@/app/listings/actions";
import { withAuthRetry } from "@/lib/auth-retry";

// Separate from DeleteListingButton -- this sets status to "removed" (a
// column update) rather than deleting the row, so it gets its own wording
// and server action instead of sharing one generic "are you sure" button.
// NOTE for whoever picks this up: nothing in the app currently sets a
// listing's status back to "active" after this -- there's no seller-facing
// "relist" action and no admin mutation for it either (see BUGS_AND_TODO.md).
// The label implies this is reversible; today it effectively isn't.
export function MarkUnavailableButton({ listingId }: { listingId: string }) {
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    if (!window.confirm("Mark this listing as unavailable? Buyers will no longer be able to see it.")) {
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await withAuthRetry(() => markListingUnavailableAction(listingId));
        setDone(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not update this listing.");
      }
    });
  }

  if (done) {
    return <p className="text-center text-sm font-medium text-neutral-500">Listing marked unavailable.</p>;
  }

  return (
    <div>
      <Button type="button" onClick={handleClick} disabled={isPending} variant="outline" className="w-full">
        <CircleOff className="size-4" />
        {isPending ? "Updating..." : "Mark unavailable"}
      </Button>
      {error && <p className="mt-1 text-center text-xs text-red-600" role="alert">{error}</p>}
    </div>
  );
}
