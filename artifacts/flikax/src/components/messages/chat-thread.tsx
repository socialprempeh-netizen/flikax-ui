"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { Phone, Send, Tag } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { revealPhoneAction } from "@/app/messages/actions";
import { formatRelativeTime } from "@/lib/format-time";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Message = {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

const QUICK_REPLIES = [
  "Is this available now?",
  "Last price?",
  "More photos please",
  "Reserve for me",
  "Can you deliver?",
];

export function ChatThread({
  conversationId,
  currentUserId,
  otherPartyName,
  isBuyer,
  initialMessages,
  initialPhoneRevealedByBuyer,
  initialPhoneRevealedBySeller,
  currentUserPhone,
  otherPartyPhone,
}: {
  conversationId: string;
  currentUserId: string;
  otherPartyName: string;
  isBuyer: boolean;
  initialMessages: Message[];
  initialPhoneRevealedByBuyer: boolean;
  initialPhoneRevealedBySeller: boolean;
  currentUserPhone: string | null;
  otherPartyPhone: string | null;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [phoneRevealedByBuyer, setPhoneRevealedByBuyer] = useState(initialPhoneRevealedByBuyer);
  const [phoneRevealedBySeller, setPhoneRevealedBySeller] = useState(initialPhoneRevealedBySeller);
  const [draft, setDraft] = useState("");
  const [offerOpen, setOfferOpen] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const [isSending, startSendTransition] = useTransition();
  const [isRevealing, startRevealTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`conversation-${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const inserted = payload.new as Message;
          setMessages((prev) => (prev.some((m) => m.id === inserted.id) ? prev : [...prev, inserted]));
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "conversations", filter: `id=eq.${conversationId}` },
        (payload) => {
          const updated = payload.new as { phone_revealed_by_buyer: boolean; phone_revealed_by_seller: boolean };
          setPhoneRevealedByBuyer(updated.phone_revealed_by_buyer);
          setPhoneRevealedBySeller(updated.phone_revealed_by_seller);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Previously this fired the insert and relied entirely on the realtime
  // subscription above to reflect it back into `messages` -- so any blip in
  // the websocket (a brief disconnect, reconnect delay, replication lag)
  // meant a message that genuinely saved server-side never appeared in the
  // sender's own thread, indistinguishable from a real failure. Selecting
  // the inserted row back and appending it directly makes the sender's own
  // message appear immediately regardless of realtime health; the dedupe
  // check in the INSERT handler above still protects against a double-add
  // if the realtime event also arrives for it.
  function sendMessageBody(body: string) {
    const trimmed = body.trim();
    if (!trimmed) return;

    setError(null);
    startSendTransition(async () => {
      const supabase = createClient();
      const { data, error: sendError } = await supabase
        .from("messages")
        .insert({ conversation_id: conversationId, sender_id: currentUserId, body: trimmed })
        .select("id, sender_id, body, created_at")
        .single();

      if (sendError || !data) {
        setError("Message failed to send. Please try again.");
        setDraft(trimmed);
        return;
      }

      setMessages((prev) => (prev.some((m) => m.id === data.id) ? prev : [...prev, data]));
    });
  }

  function handleSend(event: FormEvent) {
    event.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setDraft("");
    sendMessageBody(body);
  }

  function handleQuickReply(text: string) {
    sendMessageBody(text);
  }

  function handleOfferSubmit(event: FormEvent) {
    event.preventDefault();
    const amount = offerAmount.trim();
    if (!amount) return;
    sendMessageBody(`Offer: GH₵${amount}`);
    setOfferAmount("");
    setOfferOpen(false);
  }

  function handleReveal() {
    startRevealTransition(async () => {
      try {
        await revealPhoneAction(conversationId);
        if (isBuyer) setPhoneRevealedByBuyer(true);
        else setPhoneRevealedBySeller(true);
      } catch {
        setError("Could not share your phone number. Please try again.");
      }
    });
  }

  const myPhoneShared = isBuyer ? phoneRevealedByBuyer : phoneRevealedBySeller;
  const bothRevealed = phoneRevealedByBuyer && phoneRevealedBySeller;

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-neutral-100 bg-white shadow-sm">
      <div className="border-b border-neutral-100 p-4">
        {bothRevealed && otherPartyPhone ? (
          <a
            href={`tel:${otherPartyPhone}`}
            className="flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white hover:bg-brand-dark"
          >
            <Phone className="size-4" />
            Call {otherPartyName} — {otherPartyPhone}
          </a>
        ) : myPhoneShared ? (
          <p className="text-center text-sm text-neutral-500">
            Waiting for {otherPartyName} to share their number too...
          </p>
        ) : currentUserPhone ? (
          <Button type="button" onClick={handleReveal} disabled={isRevealing} variant="outline" className="w-full">
            <Phone className="size-4" />
            {isRevealing ? "Sharing..." : "Share my phone number"}
          </Button>
        ) : (
          <p className="text-center text-xs text-neutral-400">
            Add a phone number in Settings to share contact info in chat.
          </p>
        )}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="text-center text-sm text-neutral-400">
            Say hello — messages about this listing appear here.
          </p>
        )}
        {messages.map((message) => {
          const isMine = message.sender_id === currentUserId;
          return (
            <div key={message.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                  isMine ? "bg-brand text-white" : "bg-neutral-100 text-neutral-800"
                }`}
              >
                <p className="whitespace-pre-wrap">{message.body}</p>
                <p className={`mt-1 text-[10px] ${isMine ? "text-white/70" : "text-neutral-400"}`}>
                  {formatRelativeTime(new Date(message.created_at))}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-neutral-100 p-3 pb-2">
        {offerOpen ? (
          <form onSubmit={handleOfferSubmit} className="mb-2 flex items-center gap-2">
            <span className="flex flex-1 items-center gap-1 rounded-full border border-brand/40 bg-brand-light px-4 py-2 text-sm font-semibold text-neutral-700 focus-within:border-brand">
              GH₵
              <input
                autoFocus
                type="number"
                min="0"
                step="1"
                inputMode="decimal"
                value={offerAmount}
                onChange={(e) => setOfferAmount(e.target.value)}
                placeholder="Amount"
                className="w-full min-w-0 bg-transparent outline-none placeholder:text-neutral-400"
              />
            </span>
            <Button type="submit" disabled={isSending || !offerAmount.trim()} className="rounded-full">
              Send
            </Button>
            <Button
              type="button"
              onClick={() => {
                setOfferOpen(false);
                setOfferAmount("");
              }}
              variant="ghost"
              className="text-neutral-400 hover:text-neutral-600"
            >
              Cancel
            </Button>
          </form>
        ) : (
          <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
            <Button
              type="button"
              onClick={() => setOfferOpen(true)}
              disabled={isSending}
              variant="outline"
              size="sm"
              className="shrink-0 rounded-full border-brand/30 bg-brand-light text-brand hover:bg-brand/10 hover:text-brand"
            >
              <Tag className="size-3" />
              Make an offer
            </Button>
            {QUICK_REPLIES.map((text) => (
              <Button
                key={text}
                type="button"
                onClick={() => handleQuickReply(text)}
                disabled={isSending}
                variant="outline"
                size="sm"
                className="shrink-0 rounded-full text-neutral-600 hover:border-brand/40 hover:bg-brand-light hover:text-brand"
              >
                {text}
              </Button>
            ))}
          </div>
        )}

        <form onSubmit={handleSend} className="flex items-center gap-2">
          <Input
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Type a message..."
            maxLength={2000}
            className="h-auto flex-1 rounded-full border-neutral-200 px-4 py-2 text-sm focus-visible:border-brand"
          />
          <Button
            type="submit"
            disabled={isSending || !draft.trim()}
            size="icon"
            className="size-11 shrink-0 rounded-full shadow-sm hover:shadow-md active:scale-95 disabled:bg-neutral-200 disabled:text-neutral-400 disabled:shadow-none"
          >
            <Send className="size-4.5" />
          </Button>
        </form>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      </div>
    </div>
  );
}
