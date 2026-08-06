import Image from "next/image";

/**
 * The *contents* of an avatar circle, not the circle itself -- every place
 * in the app that shows a seller/user avatar already has its own
 * differently-sized, differently-colored `relative overflow-hidden
 * rounded-full` wrapper (header chip, dashboard sidebar, seller-store
 * header, listing detail card, /u/[id], top sellers...), so this doesn't
 * dictate size/background/ring styling. It just answers the one question
 * every one of those wrappers needs answered the same way: show the
 * uploaded photo if there is one, otherwise fall back to initials text.
 *
 * The wrapper is responsible for `position: relative` + `overflow-hidden`
 * (required for the `fill` image below to clip to the circle) and for its
 * own size -- this component only fills whatever box it's placed in.
 */
export function AvatarContent({
  avatarUrl,
  initials,
  sizes = "64px",
}: {
  avatarUrl?: string | null;
  initials: string;
  /** Passed straight through to next/image's `sizes` -- callers rendering
   * a much larger circle (e.g. the seller-store header) should override
   * this so the browser doesn't request an undersized image. */
  sizes?: string;
}) {
  if (avatarUrl) {
    return <Image src={avatarUrl} alt="" fill sizes={sizes} quality={82} className="object-cover" />;
  }
  return <>{initials}</>;
}
