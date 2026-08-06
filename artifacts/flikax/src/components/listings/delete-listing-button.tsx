"use client";

import { Button } from "@/components/ui/button";

// No listingId prop -- deliberately dumb. It's meant to sit inside a
// <form action={deleteListingAction}> that already carries the id via a
// hidden input (see DashboardListingsList), so the id doesn't need to be
// re-plumbed through this component too. The confirm() blocking the submit
// is the only thing it actually owns.
export function DeleteListingButton() {
  return (
    <Button
      type="submit"
      variant="ghost"
      size="sm"
      className="text-red-600 hover:bg-red-50 hover:text-red-600"
      onClick={(e) => {
        if (!confirm("Delete this listing? This can't be undone.")) {
          e.preventDefault();
        }
      }}
    >
      Delete
    </Button>
  );
}
