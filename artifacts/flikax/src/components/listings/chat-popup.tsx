"use client";

import { useState, useCallback } from "react";
import { MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getOrCreateConversationIdAction } from "@/app/messages/actions";
import { createClient } from "@/lib/supabase/client";
import { ChatThread } from "@/components/messages/chat-thread";

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
}: {
  listingId: string;
  sellerName: string;
  currentPath: string;
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
             listing:listings(contact_phone)`
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

      const currentUserPhone = (isBuyer ? buyer?.phone : seller?.phone) ?? null;
      const otherPartyPhone = isBuyer
        ? listing?.contact_phone || seller?.phone || null
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
      <Button
        type="button"
        onClick={handleOpen}
        disabled={phase === "loading"}
        variant="outline"
        className="flex-1 border-2 border-brand text-brand hover:bg-brand-light hover:text-brand"
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

  return (
    /* Fixed bottom-right panel — sits above everything, no backdrop */
    <div
      className="fixed bottom-20 right-4 z-[9999] flex w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-2xl lg:bottom-6"
      style={{ height: 520 }}
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
