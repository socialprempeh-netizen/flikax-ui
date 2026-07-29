"use client";

import { Button } from "@/components/ui/button";

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
