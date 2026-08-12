import Link from "next/link";
import { PencilLine } from "lucide-react";
import { FlikaxLogo } from "@/components/flikax-logo";
import { FaApple, FaGooglePlay } from "react-icons/fa6";
import { FacebookIcon, XIcon, TikTokIcon, InstagramIcon, LinkedInIcon } from "@/components/icons/social-icons";
import { SellCta } from "@/components/cta/sell-cta";
import { JsonLd } from "@/components/seo/json-ld";
import { getSiteUrl } from "@/lib/site-url";

const SITE_URL = getSiteUrl();

const localBusinessJsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "Flikax",
  url: SITE_URL,
  address: {
    "@type": "PostalAddress",
    addressLocality: "Tema, Accra",
    addressCountry: "GH",
  },
};

const exploreLinks = [
  { label: "Vehicles", href: "/?category=vehicles" },
  { label: "Property", href: "/?category=property" },
  { label: "Electronics", href: "/?category=electronics" },
  { label: "Services", href: "/?category=services" },
];
const companyLinks = [
  { label: "About Us", href: "/about" },
  { label: "Trust & Safety", href: "/trust-safety" },
  { label: "Contact Us", href: "/contact" },
];
const legalLinks = [
  { label: "Terms of Service", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
];

// No real social accounts exist yet -- these render as plain icons (not
// links to profiles that don't exist). Every icon is a self-contained
// colored circle badge (own solid/gradient bg per brand, unaffected by the
// footer's own background), so all five stay clearly recognizable by their
// real brand colors instead of blending into a uniform monotone treatment.
const socialIcons = [
  { label: "X", icon: XIcon },
  { label: "Facebook", icon: FacebookIcon },
  { label: "Instagram", icon: InstagramIcon },
  { label: "TikTok", icon: TikTokIcon },
  { label: "LinkedIn", icon: LinkedInIcon },
];

export function SiteFooter() {
  return (
    <footer className="-[2.5rem] bg-[#C3EEB9] px-6 py-5 text-neutral-900 sm:px-10 sm:py-6">
      <JsonLd data={localBusinessJsonLd} />
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center gap-2 text-center">
          <FlikaxLogo wordmarkColor="text-black" />
          <div>
            <p className="text-sm text-neutral-700">Your Trusted Classifieds Marketplace.</p>
            <p className="text-xs text-neutral-600">
              Accra, Ghana <span className="px-1">•</span> © 2026 Flikax Inc.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {socialIcons.map(({ label, icon: Icon }) => (
              <span
                key={label}
                role="img"
                title={label}
                aria-label={label}
                className="flex items-center justify-center transition-transform duration-200 hover:scale-110"
              >
                <Icon className="size-8" />
              </span>
            ))}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-5">
          <div>
            <h3 className="mb-2 text-sm font-bold text-neutral-800">Explore</h3>
            <ul className="space-y-0.5">
              {exploreLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="flex min-h-11 items-center text-sm text-neutral-700 hover:text-neutral-900">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-bold text-neutral-800">Post an Ad</h3>
            <SellCta
              label="Create Your Listing"
              variant="footer"
              size="sm"
              icon={<PencilLine className="size-4" />}
              className="!justify-start !font-medium"
            />
          </div>

          <div>
            <h3 className="mb-2 text-sm font-bold text-neutral-800">Company</h3>
            <ul className="space-y-0.5">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="flex min-h-11 items-center text-sm text-neutral-700 hover:text-neutral-900">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-bold text-neutral-800">Legal</h3>
            <ul className="space-y-0.5">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="flex min-h-11 items-center text-sm text-neutral-700 hover:text-neutral-900">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-bold text-neutral-800">Get the App</h3>
            <div className="flex flex-col gap-1.5">
              <span className="flex cursor-default items-center gap-2 border border-black/10 bg-black/5 px-2.5 py-1">
                <FaApple className="size-4 shrink-0" />
                <span className="leading-tight">
                  <span className="block text-4xs text-neutral-500">Coming Soon</span>
                  <span className="block text-xs font-semibold">App Store</span>
                </span>
              </span>
              <span className="flex cursor-default items-center gap-2 border border-black/10 bg-black/5 px-2.5 py-1">
                <FaGooglePlay className="size-3.5 shrink-0" />
                <span className="leading-tight">
                  <span className="block text-4xs text-neutral-500">Coming Soon</span>
                  <span className="block text-xs font-semibold">Google Play</span>
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
