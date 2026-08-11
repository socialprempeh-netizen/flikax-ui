"use client";

import { useState, useCallback } from "react";
import { MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getOrCreateConversationIdAction } from "@/app/messages/actions";
import { createClient } from "@/lib/supabase/client";
import { ChatThread } from "@/components/messages/chat-thread";
import { useVisualViewportHeight } from "@/lib/use-visual-viewport-height";

type Message = {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

type ConversationData = {
  conversationId: string;
  currentUserId: string;
  otherPartyName: string;
  isBuyer: boolean;
  initialMessages: Message[];
  initialPhoneRevealedByBuyer: boolean;
  initialPhoneRevealedBySeller: boolean;
  currentUserPhone: string | null;
  otherPartyPhone: string | null;
};

/**
 * Drop-in replacement for StartChatButton.
 * Opens an Alibaba-style inline chat popup instead of navigating away.
 */
export function ChatPopupButton({
  listingId,
  sellerName,
  currentPath,
  compact = false,
}: {
  listingId: string;
  sellerName: string;
  currentPath: string;
  /** Content-sized and sharing a row with a sibling action, rather than the
   * default full-width block used when this stands alone in a flex-col. */
  compact?: boolean;
}) {
  const [phase, setPhase] = useState<"idle" | "loading" | "open">("idle");
  const [data, setData] = useState<ConversationData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleOpen = useCallback(async () => {
    if (phase === "loading" || phase === "open") return;
    setPhase("loading");
    setError(null);

    try {
      // Server action returns conversationId (or redirects to login for unauthed)
      const { conversationId } = await getOrCreateConversationIdAction(listingId, currentPath);

      const supabase = createClient();
      const [
        { data: { user } },
        { data: conv },
        { data: msgs },
      ] = await Promise.all([
        supabase.auth.getUser(),
        supabase
          .from("conversations")
          .select(
            `id, buyer_id, seller_id, phone_revealed_by_buyer, phone_revealed_by_seller,
             buyer:profiles!conversations_buyer_id_fkey(full_name, phone),
             seller:profiles!conversations_seller_id_fkey(full_name, phone),
             listing:listings(id)`
          )
          .eq("id", conversationId)
          .maybeSingle(),
        supabase
          .from("messages")
          .select("id, sender_id, body, created_at")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true })
          .limit(50),
      ]);

      if (!user || !conv) throw new Error("Could not load chat");

      const isBuyer = user.id === conv.buyer_id;
      const buyer = Array.isArray(conv.buyer) ? conv.buyer[0] : conv.buyer;
      const seller = Array.isArray(conv.seller) ? conv.seller[0] : conv.seller;
      const listing = Array.isArray(conv.listing) ? conv.listing[0] : conv.listing;

      // contact_phone can no longer be selected directly off listings --
      // authorized here by the caller being a participant in this conversation.
      const { data: listingContactPhone } = listing
        ? await supabase.rpc("get_listing_contact_phone", { p_listing_id: listing.id })
        : { data: null };

      const currentUserPhone = (isBuyer ? buyer?.phone : seller?.phone) ?? null;
      const otherPartyPhone = isBuyer
        ? listingContactPhone || seller?.phone || null
        : buyer?.phone || null;
      const resolvedName =
        (isBuyer ? seller?.full_name : buyer?.full_name) || sellerName || "Seller";

      setData({
        conversationId,
        currentUserId: user.id,
        otherPartyName: resolvedName,
        isBuyer,
        initialMessages: msgs ?? [],
        initialPhoneRevealedByBuyer: conv.phone_revealed_by_buyer,
        initialPhoneRevealedBySeller: conv.phone_revealed_by_seller,
        currentUserPhone,
        otherPartyPhone,
      });
      setPhase("open");
    } catch (err) {
      console.error("[ChatPopup]", err);
      setError("Could not open chat. Please try again.");
      setPhase("idle");
    }
  }, [listingId, currentPath, sellerName, phase]);

  return (
    <>
      {/* Solid green, not brand-teal -- "Send Message" sits next to a solid
          teal "Contact Seller" button and needs its own distinct color to
          read as a separate action, not a fainter version of it. Solid
          (not a light tint) so it carries the same visual weight as
          Contact Seller instead of reading as the secondary/lesser option. */}
      <Button
        type="button"
        onClick={handleOpen}
        disabled={phase === "loading"}
        className={`h-11 bg-green-600 text-white hover:bg-green-700 ${compact ? "flex-1" : "w-full"}`}
      >
        <MessageCircle className="size-4" />
        {phase === "loading" ? "Opening…" : "Send Message"}
      </Button>

      {error && <p className="mt-1 text-xs text-red-600" role="alert">{error}</p>}

      {phase === "open" && data && (
        <ChatPopupOverlay data={data} onClose={() => setPhase("idle")} />
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Popup overlay                                                         */
/* ------------------------------------------------------------------ */

function ChatPopupOverlay({
  data,
  onClose,
}: {
  data: ConversationData;
  onClose: () => void;
}) {
  const initial = data.otherPartyName[0]?.toUpperCase() ?? "S";
  const visualViewportHeight = useVisualViewportHeight();

  return (
    /* Full-screen on mobile (h-[var(--vvh)], no inset) rather than a fixed
       520px box anchored to the bottom. Height comes from
       window.visualViewport (--vvh, set below) so it shrinks with the
       on-screen keyboard even in webviews where CSS `dvh` doesn't reliably
       track it -- `100dvh` is only the fallback for the instant before that
       JS value is available. A fixed pixel height anchored via `bottom-20`
       wouldn't shrink at all, so the chat input (the box's last,
       non-scrolling child) could end up hidden behind the keyboard. sm+
       keeps the floating bottom-right panel. */
    <div
      className="fixed inset-0 z-[9999] flex h-[var(--vvh,100dvh)] w-full flex-col overflow-hidden bg-white sm:inset-auto sm:bottom-20 sm:right-4 sm:h-[520px] sm:w-[380px] sm:max-w-[calc(100vw-2rem)] sm:rounded-xl sm:border sm:border-neutral-200 sm:shadow-2xl lg:bottom-6"
      style={visualViewportHeight ? ({ "--vvh": `${visualViewportHeight}px` } as React.CSSProperties) : undefined}
    >

      {/* ── Header ── */}
      <div className="flex shrink-0 items-center gap-3 bg-[#1a1f2e] px-4 py-3">
        {/* Avatar */}
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
          {initial}
        </span>

        {/* Name + role */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-white">{data.otherPartyName}</p>
          <p className="text-xs text-white/50">Seller · Flikax</p>
        </div>

        {/* Close */}
        <Button
          type="button"
          onClick={onClose}
          aria-label="Close chat"
          variant="ghost"
          size="icon-sm"
          className="size-11 rounded-full text-white/60 hover:bg-white/10 hover:text-white"
        >
          <X className="size-4" />
        </Button>
      </div>

      {/* ── Chat thread (flex-1 so it fills remaining height) ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <ChatThread
          conversationId={data.conversationId}
          currentUserId={data.currentUserId}
          otherPartyName={data.otherPartyName}
          isBuyer={data.isBuyer}
          initialMessages={data.initialMessages}
          initialPhoneRevealedByBuyer={data.initialPhoneRevealedByBuyer}
          initialPhoneRevealedBySeller={data.initialPhoneRevealedBySeller}
          currentUserPhone={data.currentUserPhone}
          otherPartyPhone={data.otherPartyPhone}
        />
      </div>
    </div>
  );
}
