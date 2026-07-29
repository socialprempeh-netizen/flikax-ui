import { FaFacebookF, FaWhatsapp, FaXTwitter } from "react-icons/fa6";
import { cn } from "@/lib/utils";

// Official TikTok "musical note" glyph outline (simple-icons, CC0).
const TIKTOK_NOTE_PATH =
  "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z";

export function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" {...props}>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6.1 29.6 4 24 4c-7.4 0-13.8 4.2-17.7 10.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.5 0 10.4-1.9 14.2-5.1l-6.6-5.6c-2 1.5-4.6 2.6-7.6 2.6-5.3 0-9.7-3.1-11.3-7.7l-6.5 5C9.9 39.6 16.4 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.6 5.6C41.4 36.4 44 30.6 44 24c0-1.3-.1-2.7-.4-3.5z"
      />
    </svg>
  );
}

type BrandIconProps = {
  className?: string;
};

// Every brand mark below renders as a self-contained circular badge -- the
// component itself is the round, colored container -- so consumers just set
// a uniform size class (e.g. size-9) and never need to nest it inside a
// second bordered wrapper (which used to double up with the old raster
// badges' own baked-in rounded-square backgrounds and look "boxy").
function CircleBadge({
  className,
  bgClassName,
  children,
}: {
  className?: string;
  bgClassName: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "flex aspect-square items-center justify-center overflow-hidden rounded-full",
        bgClassName,
        className,
      )}
    >
      {children}
    </span>
  );
}

export function FacebookIcon({ className }: BrandIconProps) {
  return (
    <CircleBadge className={className} bgClassName="bg-[#1877F2]">
      <FaFacebookF className="size-[52%] text-white" aria-hidden="true" />
    </CircleBadge>
  );
}

export function WhatsAppIcon({ className }: BrandIconProps) {
  return (
    <CircleBadge className={className} bgClassName="bg-[#25D366]">
      <FaWhatsapp className="size-[62%] text-white" aria-hidden="true" />
    </CircleBadge>
  );
}

export function XIcon({ className }: BrandIconProps) {
  return (
    <CircleBadge className={className} bgClassName="bg-black">
      <FaXTwitter className="size-[50%] text-white" aria-hidden="true" />
    </CircleBadge>
  );
}

export function TikTokIcon({ className }: BrandIconProps) {
  return (
    <CircleBadge className={className} bgClassName="bg-black">
      {/* The signature layered look: the same note outline drawn three times,
          cyan and pink/red copies peeking out from a slight diagonal offset
          behind a solid white top layer -- how the official multi-color mark
          is actually constructed. */}
      <svg viewBox="0 0 24 24" className="size-[58%]" aria-hidden="true">
        <path d={TIKTOK_NOTE_PATH} fill="#25F4EE" transform="translate(-0.9,-0.6)" />
        <path d={TIKTOK_NOTE_PATH} fill="#FE2C55" transform="translate(0.9,0.6)" />
        <path d={TIKTOK_NOTE_PATH} fill="#FFFFFF" />
      </svg>
    </CircleBadge>
  );
}
