"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { startOrGetConversationAction } from "@/app/messages/actions";

// NOT CURRENTLY USED ANYWHERE -- superseded by ChatPopupButton (see
// components/listings/chat-popup.tsx, whose own comment calls it "a drop-in
// replacement for StartChatButton"). This navigates to a full conversation
// page on submit; ChatPopupButton opens an inline overlay instead without
// leaving the listing page. Left in place rather than deleted in case the
// full-page flow is wanted again, but flag this as dead code during cleanup
// (see BUGS_AND_TODO.md) -- it has zero import sites today.
export function StartChatButton({
  listingId,
  currentPath,
}: {
  listingId: string;
  currentPath: string;
}) {
  const [pending, setPending] = useState(false);
  const action = startOrGetConversationAction.bind(null, listingId, currentPath);

  return (
    <form action={action} onSubmit={() => setPending(true)}>
      <Button
        type="submit"
        disabled={pending}
        variant="outline"
        className="flex-1 border-2 border-brand text-brand hover:bg-brand-light hover:text-brand"
      >
        <MessageCircle className="size-4" />
        {pending ? "Opening…" : "Send Message"}
      </Button>
    </form>
  );
}
