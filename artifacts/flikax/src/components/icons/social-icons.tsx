import Image from "next/image";
import { cn } from "@/lib/utils";

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

// The four platform logos below are the user's real brand assets (fixed
// full-color artwork), not recolorable currentColor glyphs like GoogleIcon
// above -- so they're rendered via next/image rather than inline <svg>.
// object-contain guards TikTok's non-square source canvas from distorting.
function BrandIcon({ src, alt, className }: BrandIconProps & { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={48}
      height={48}
      className={cn("size-4 object-contain", className)}
    />
  );
}

export function FacebookIcon({ className }: BrandIconProps) {
  return <BrandIcon src="/images/social/facebook.png" alt="Facebook" className={className} />;
}

export function XIcon({ className }: BrandIconProps) {
  return <BrandIcon src="/images/social/x.png" alt="X" className={className} />;
}

export function WhatsAppIcon({ className }: BrandIconProps) {
  return <BrandIcon src="/images/social/whatsapp.png" alt="WhatsApp" className={className} />;
}

export function TikTokIcon({ className }: BrandIconProps) {
  return <BrandIcon src="/images/social/tiktok.png" alt="TikTok" className={className} />;
}
