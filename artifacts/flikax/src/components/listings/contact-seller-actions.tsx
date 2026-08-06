"use client";

import { ChatPopupButton } from "@/components/listings/chat-popup";
import { useSessionSummary } from "@/lib/use-session-summary";

// Client component purely so `isOwner` can be resolved from the logged-in
// user's session -- the server-rendered detail page around this doesn't
// know who's viewing it (see [category]/[slug]/page.tsx's own comments on
// why ownership-gated UI is resolved client-side rather than server-side).
export function ContactSellerActions({
  listingId,
  sellerId,
  sellerName,
  hasPhone,
  currentPath,
}: {
  listingId: string;
  sellerId: string;
  sellerName: string;
  hasPhone: boolean;
  currentPath: string;
}) {
  const { userId } = useSessionSummary();
  const isOwner = userId === sellerId;

  return (
    <>
      {!isOwner && (
        <ChatPopupButton
          listingId={listingId}
          sellerName={sellerName}
          currentPath={currentPath}
        />
      )}
      {!hasPhone && isOwner && <p className="text-sm text-neutral-400">No contact info available.</p>}
    </>
  );
}
