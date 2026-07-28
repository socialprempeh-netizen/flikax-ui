"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
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
      <button
        type="submit"
        disabled={pending}
        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border-2 border-brand bg-white px-3 py-2 text-sm font-bold text-brand hover:bg-brand-light disabled:opacity-60"
      >
        <MessageCircle className="size-4" />
        {pending ? "Opening…" : "Send Message"}
      </button>
    </form>
  );
}
