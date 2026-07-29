"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { startOrGetConversationAction } from "@/app/messages/actions";

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
