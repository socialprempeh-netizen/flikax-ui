"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { FacebookIcon, XIcon, WhatsAppIcon, TikTokIcon } from "@/components/icons/social-icons";

const ICON_LINK_CLASS =
  "flex size-9 items-center justify-center rounded-full shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:scale-105 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2";

export function ShareButtons({ title, priceLabel }: { title: string; priceLabel: string }) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);

  // Deferred to an effect (rather than read directly during render) so the
  // server-rendered and first client render match — window isn't available
  // during SSR, and reading it inline would cause a hydration mismatch.
  useEffect(() => {
    setUrl(window.location.href);
  }, []);

  const shareText = `${title} - ${priceLabel} on Flikax`;

  async function copyForTikTok() {
    await navigator.clipboard.writeText(`${shareText} ${url}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm font-medium text-neutral-500">Share:</span>

      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(shareText)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on Facebook"
        className={ICON_LINK_CLASS}
      >
        <FacebookIcon className="size-9" />
      </a>

      <a
        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${url}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on WhatsApp"
        className={ICON_LINK_CLASS}
      >
        <WhatsAppIcon className="size-9" />
      </a>

      <a
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on X"
        className={ICON_LINK_CLASS}
      >
        <XIcon className="size-9" />
      </a>

      <button
        type="button"
        onClick={copyForTikTok}
        aria-label="Copy link to share on TikTok"
        title="TikTok doesn't support pre-filled link sharing — this copies the listing details instead"
        className={cn(ICON_LINK_CLASS, copied && "ring-2 ring-green-400")}
      >
        {copied ? (
          <span className="flex size-9 items-center justify-center rounded-full bg-green-100 text-green-600">
            <Check className="size-4" />
          </span>
        ) : (
          <TikTokIcon className="size-9" />
        )}
      </button>

      {copied && (
        <span className="text-xs font-medium text-green-600">Copied! Paste it in your TikTok caption.</span>
      )}
    </div>
  );
}
