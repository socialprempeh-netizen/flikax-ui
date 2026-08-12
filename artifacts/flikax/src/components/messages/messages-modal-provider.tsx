"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ImageOff, MessageSquare, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { resolveListingImageUrl } from "@/lib/images";
import { formatRelativeTime } from "@/lib/format-time";
import { isConversationUnread } from "@/lib/messages";
import { ChatThread } from "@/components/messages/chat-thread";
import { useVisualViewportHeight } from "@/lib/use-visual-viewport-height";

type Message = { id: string; sender_id: string; body: string; created_at: string };

type ConversationRow = {
  id: string;
  buyer_id: string;
  seller_id: string;
  last_message_at: string;
  last_read_by_buyer_at: string | null;
  last_read_by_seller_at: string | null;
  listing: { id: string; title: string; status: string; listing_images: { storage_path: string; position: number }[] } | null;
  buyer: { full_name: string | null } | null;
  seller: { full_name: string | null } | null;
};

type ThreadData = {
  conversationId: string;
  otherPartyName: string;
  isBuyer: boolean;
  initialMessages: Message[];
  initialPhoneRevealedByBuyer: boolean;
  initialPhoneRevealedBySeller: boolean;
  currentUserPhone: string | null;
  otherPartyPhone: string | null;
};

// Supabase's client typings sometimes infer a to-one FK join as an array
// depending on how the relationship is declared -- normalizing here means
// every read site doesn't need to repeat the same defensive check.
function one<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

type MessagesModalContextValue = { openMessages: () => void };

const MessagesModalContext = createContext<MessagesModalContextValue | null>(null);

// Same rationale as AuthModalProvider: a plain client-state Dialog rather
// than a route, so opening the inbox from the header/bottom-tab-bar never
// leaves the page the user was on. /messages and /messages/[id] still exist
// as real, deep-linkable full pages (e.g. from a notification email).
export function MessagesModalProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const visualViewportHeight = useVisualViewportHeight();

  return (
    <MessagesModalContext.Provider value={{ openMessages: () => setOpen(true) }}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton
          // Full-screen on mobile (top-0, h-[var(--vvh)], no centering
          // transform) rather than the small vh-centered box used at sm+.
          // Height comes from window.visualViewport (--vvh, set below),
          // which shrinks with the on-screen keyboard even in webviews
          // where CSS `dvh` doesn't reliably track it; `100dvh` is only the
          // fallback for the instant before that JS value is available. A
          // fixed-height box centered against the *pre-keyboard* viewport
          // could end up with its bottom half (where the chat input lives)
          // sitting behind the keyboard -- full-screen sidesteps that: the
          // dialog IS the visible viewport, so the input (last, non-scrolling
          // flex child) always lands right above wherever the keyboard starts.
          className="flex top-0 left-0 h-[var(--vvh,100dvh)] w-full max-w-full translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden border-0 bg-white p-0 shadow-2xl sm:top-[50%] sm:left-[50%] sm:h-[min(600px,calc(100dvh-4rem))] sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:border sm:border-slate-200/80"
          style={visualViewportHeight ? ({ "--vvh": `${visualViewportHeight}px` } as React.CSSProperties) : undefined}
        >
          <DialogTitle className="sr-only">Messages</DialogTitle>
          {open && <MessagesPanelBody />}
        </DialogContent>
      </Dialog>
    </MessagesModalContext.Provider>
  );
}

export function useMessagesModal() {
  const ctx = useContext(MessagesModalContext);
  if (!ctx) throw new Error("useMessagesModal must be used within MessagesModalProvider");
  return ctx;
}

function MessagesPanelBody() {
  const [status, setStatus] = useState<"loading" | "list" | "signed-out" | "error">("loading");
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [thread, setThread] = useState<ThreadData | null>(null);
  const [threadLoading, setThreadLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (!cancelled) setStatus("signed-out");
        return;
      }

      const { data, error } = await supabase
        .from("conversations")
        .select(
          `id, buyer_id, seller_id, last_message_at, last_read_by_buyer_at, last_read_by_seller_at,
           listing:listings(id, title, status, listing_images(storage_path, position)),
           buyer:profiles!conversations_buyer_id_fkey(full_name),
           seller:profiles!conversations_seller_id_fkey(full_name)`
        )
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order("last_message_at", { ascending: false });

      if (cancelled) return;
      if (error) {
        setStatus("error");
        return;
      }

      setCurrentUserId(user.id);
      setConversations((data ?? []) as unknown as ConversationRow[]);
      setStatus("list");
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const openThread = useCallback(async (conversationId: string) => {
    setThreadLoading(true);
    const supabase = createClient();

    const [
      {
        data: { user },
      },
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

    setThreadLoading(false);
    if (!user || !conv) return;

    const isBuyer = user.id === conv.buyer_id;
    const buyer = one(conv.buyer);
    const seller = one(conv.seller);
    const listing = one(conv.listing);

    // contact_phone can no longer be selected directly off listings --
    // authorized here by the caller being a participant in this conversation.
    const { data: listingContactPhone } = listing
      ? await supabase.rpc("get_listing_contact_phone", { p_listing_id: listing.id })
      : { data: null };

    const currentUserPhone = (isBuyer ? buyer?.phone : seller?.phone) ?? null;
    const otherPartyPhone = isBuyer ? listingContactPhone || seller?.phone || null : buyer?.phone || null;
    const resolvedName = (isBuyer ? seller?.full_name : buyer?.full_name) || "Flikax user";

    setThread({
      conversationId,
      otherPartyName: resolvedName,
      isBuyer,
      initialMessages: msgs ?? [],
      initialPhoneRevealedByBuyer: conv.phone_revealed_by_buyer,
      initialPhoneRevealedBySeller: conv.phone_revealed_by_seller,
      currentUserPhone,
      otherPartyPhone,
    });
  }, []);

  if (status === "loading") {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-neutral-300" />
      </div>
    );
  }

  if (status === "signed-out" || status === "error") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-brand-light text-brand-dark">
          <MessageSquare className="size-5" />
        </span>
        <p className="text-sm font-medium text-neutral-600">
          {status === "signed-out" ? "Sign in to see your messages." : "Couldn't load your messages."}
        </p>
      </div>
    );
  }

  if (thread) {
    return (
      <>
        <div className="flex shrink-0 items-center gap-3 border-b border-neutral-300 bg-[#1a1f2e] px-4 py-3">
          <button
            type="button"
            onClick={() => setThread(null)}
            aria-label="Back to all messages"
            className="flex size-8 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="size-4" />
          </button>
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-dark text-xs font-bold text-white">
            {thread.otherPartyName[0]?.toUpperCase() ?? "F"}
          </span>
          <p className="truncate text-sm font-bold text-white">{thread.otherPartyName}</p>
        </div>
        <ChatThread
          conversationId={thread.conversationId}
          currentUserId={currentUserId!}
          otherPartyName={thread.otherPartyName}
          isBuyer={thread.isBuyer}
          initialMessages={thread.initialMessages}
          initialPhoneRevealedByBuyer={thread.initialPhoneRevealedByBuyer}
          initialPhoneRevealedBySeller={thread.initialPhoneRevealedBySeller}
          currentUserPhone={thread.currentUserPhone}
          otherPartyPhone={thread.otherPartyPhone}
        />
      </>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-brand-light text-brand-dark">
          <MessageSquare className="size-5" />
        </span>
        <p className="text-sm font-medium text-neutral-600">No messages yet</p>
        <p className="text-xs text-neutral-400">Message a seller from a listing to start a conversation.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-neutral-300 px-4 py-3">
        <h2 className="text-sm font-bold text-neutral-800">Messages</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {conversations.map((conversation) => {
          const isBuyer = currentUserId === conversation.buyer_id;
          const otherParty = isBuyer ? conversation.seller : conversation.buyer;
          const unread = isConversationUnread(conversation, currentUserId!);
          const cover = [...(conversation.listing?.listing_images ?? [])].sort((a, b) => a.position - b.position)[0];
          const supabase = createClient();
          const coverUrl = cover ? resolveListingImageUrl(supabase, cover.storage_path) : null;

          return (
            <button
              key={conversation.id}
              type="button"
              onClick={() => openThread(conversation.id)}
              disabled={threadLoading}
              className="flex w-full items-center gap-3 p-2.5 text-left transition-colors hover:bg-slate-50 disabled:opacity-60"
            >
              <div className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden bg-brand-light text-brand-dark/40">
                {coverUrl ? (
                  <Image src={coverUrl} alt="" fill sizes="48px" quality={82} className="object-cover" />
                ) : (
                  <ImageOff className="size-4" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className={`truncate text-sm ${unread ? "font-bold text-neutral-900" : "font-semibold text-neutral-700"}`}>
                    {otherParty?.full_name || "Flikax user"}
                  </p>
                  <span className="shrink-0 text-2xs text-neutral-400">
                    {formatRelativeTime(new Date(conversation.last_message_at))}
                  </span>
                </div>
                <p className="truncate text-xs font-medium text-neutral-400">{conversation.listing?.title}</p>
              </div>
              {unread && <span className="size-2 shrink-0 rounded-full bg-brand" />}
            </button>
          );
        })}
      </div>
      <div className="shrink-0 border-t border-neutral-300 p-2">
        <Link
          href="/messages"
          className="block px-3 py-2 text-center text-xs font-semibold text-neutral-500 hover:bg-slate-50 hover:text-brand-dark"
        >
          Open full inbox
        </Link>
      </div>
    </div>
  );
}
