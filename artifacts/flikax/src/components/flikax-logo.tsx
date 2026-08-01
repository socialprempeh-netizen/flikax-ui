import Link from "next/link";

type FlikaxLogoProps = {
  /** Where the logo links. @default "/" */
  href?: string;
  /** Extra classes on the outer flex Link (e.g. "mb-8") */
  className?: string;
  /** Tailwind text-color class for the wordmark. @default "text-white" */
  wordmarkColor?: string;
  /** Tailwind size-* class(es) for the icon box. @default "size-8" */
  iconSize?: string;
  /** Tailwind text-* class(es) for the wordmark. @default "text-2xl" */
  wordmarkSize?: string;
};

/**
 * Flikax brand logo: brand-blue rounded-square icon containing a white "F",
 * followed by the "flikax" wordmark.
 *
 * Use wordmarkColor="text-brand" on light/white backgrounds.
 * Default wordmarkColor="text-white" suits dark backgrounds.
 */
export function FlikaxLogo({
  href = "/",
  className = "",
  wordmarkColor = "text-white",
  iconSize = "size-8",
  wordmarkSize = "text-2xl",
}: FlikaxLogoProps) {
  return (
    <Link
      href={href}
      className={`flex min-h-11 items-center gap-2 ${className}`.trim()}
      aria-label="Flikax home"
    >
      {/* Orange rounded-square icon */}
      <span
        className={`${iconSize} flex shrink-0 items-center justify-center rounded-lg bg-brand font-extrabold leading-none text-white`}
        style={{ fontSize: 17 }}
        aria-hidden="true"
      >
        F
      </span>
      {/* Wordmark */}
      <span className={`font-logo font-extrabold lowercase ${wordmarkSize} ${wordmarkColor}`}>
        flikax
      </span>
    </Link>
  );
}
