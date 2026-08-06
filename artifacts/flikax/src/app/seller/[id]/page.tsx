import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, MessageSquareWarning } from "lucide-react";
import { createPublicClient } from "@/lib/supabase/public";
import { fetchSellerListings } from "@/lib/seller-listings";
import { getInitials } from "@/lib/avatar";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BottomTabBar } from "@/components/bottom-tab-bar";
import { SellerStoreListings } from "@/components/listings/seller-store-listings";
import { RevealPhoneButton } from "@/components/listings/reveal-phone-button";
import { WhatsAppIcon } from "@/components/icons/social-icons";

// Jiji-style public "seller store" page -- a storefront for browsing one
// seller's active listings, distinct from /u/[id] (that page is about
// reputation/feedback history, this one is about what they're selling
// right now). The two link to each other rather than merging, since a
// buyer landing on either one has a different immediate goal.
//
// get_public_seller_profile is the same RPC the ad detail page's seller
// card already uses -- it only returns a row when p_user_id has at least
// one *active* listing, which doubles as this page's own "does a store
// page exist here" check (no separate query needed).
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const supabase = createPublicClient();
  const { data } = await supabase.rpc("get_public_seller_profile", { p_user_id: id });
  const profile = data?.[0];
  if (!profile) return {};
  return {
    title: `${profile.full_name || "Seller"}'s shop | Flikax`,
    description: `Browse listings from ${profile.full_name || "this seller"} on Flikax.`,
  };
}

export default async function SellerStorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createPublicClient();

  const [{ data: profileRows }, { listings, categories }, { count: feedbackCount }] = await Promise.all([
    supabase.rpc("get_public_seller_profile", { p_user_id: id }),
    fetchSellerListings(id),
    supabase.from("profile_feedback").select("id", { count: "exact", head: true }).eq("profile_id", id),
  ]);

  const profile = profileRows?.[0];
  if (!profile) notFound();

  // Reuses get_listing_contact_phone (the same RPC the ad detail page calls)
  // against this seller's own top listing -- per that function's own
  // comment, an active listing's contact number is treated as public
  // (RevealPhoneButton is a click-to-show affordance, not an access-control
  // gate), so this works for anonymous visitors exactly like it does there.
  // No phone at all just means the buttons below don't render.
  const topListingId = listings[0]?.id;
  const { data: phone } = topListingId
    ? await supabase.rpc("get_listing_contact_phone", { p_listing_id: topListingId })
    : { data: null };
  const whatsappDigits = phone?.replace(/\D/g, "");

  const memberSince = new Intl.DateTimeFormat("en-GH", { month: "long", year: "numeric" }).format(
    new Date(profile.member_since)
  );
  const initials = getInitials(profile.full_name) || "F";
  const feedbackTotal = feedbackCount ?? 0;

  return (
    <div className="flex flex-1 flex-col bg-background pb-16 lg:pb-0">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-4 py-6 sm:px-6">
        {/* Header card */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-md">
          <div className="h-2 bg-brand" />
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:p-6">
            <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-brand text-2xl font-bold text-white ring-4 ring-brand-light">
              {initials}
            </span>

            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-1.5 text-lg font-bold text-neutral-800">
                {profile.full_name || "Flikax user"}
                {profile.verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">
                    <BadgeCheck className="size-3.5" />
                    Verified
                  </span>
                )}
              </p>
              <p className="text-sm text-neutral-500">
                Member since {memberSince}
                {profile.location && <> &middot; {profile.location}</>}
              </p>

              {profile.bio && <p className="mt-2 text-sm text-neutral-600">{profile.bio}</p>}

              {feedbackTotal > 0 && (
                <Link href={`/u/${profile.id}`} className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-brand hover:underline">
                  {feedbackTotal} feedback{feedbackTotal === 1 ? "" : "s"} &rsaquo;
                </Link>
              )}

              {phone && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <RevealPhoneButton phone={phone} label="Show Contact" compact />
                  {/* Not gated behind a reveal-click like RevealPhoneButton --
                      this is an action button (opens WhatsApp), not a printed
                      display of the digits, so there's no raw number shown
                      in the page text to hide in the first place. */}
                  <a
                    href={`https://wa.me/${whatsappDigits}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-md border-2 border-[#25D366] px-4 text-sm font-medium text-[#128C7E] hover:bg-[#25D366]/10 sm:flex-none"
                  >
                    <WhatsAppIcon className="size-5" />
                    WhatsApp
                  </a>
                </div>
              )}

              <Link
                href={`/u/${profile.id}`}
                className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-brand"
              >
                <MessageSquareWarning className="size-4" />
                Leave feedback
              </Link>
            </div>
          </div>
        </div>

        <SellerStoreListings listings={listings} categories={categories} />
      </main>

      <SiteFooter />
      <BottomTabBar activeHref={`/seller/${id}`} />
    </div>
  );
}
