"use client";

import { ChatPopupButton } from "@/components/listings/chat-popup";
import { useSessionSummary } from "@/lib/use-session-summary";

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
