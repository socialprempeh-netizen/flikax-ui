import Link from "next/link";
import { notFound } from "next/navigation";
import { Smile, Meh, Frown, BadgeCheck } from "lucide-react";
import { createClient, getUser } from "@/lib/supabase/server";
import { getInitials } from "@/lib/avatar";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { LeaveFeedbackForm } from "@/components/feedback/leave-feedback-form";
import { FeedbackList, type FeedbackEntry } from "@/components/feedback/feedback-list";
import { AvatarContent } from "@/components/avatar-content";

export default async function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: userData }, { data: directProfile }, { data: feedback }] = await Promise.all([
    getUser(),
    // Works when the viewer is this profile's owner (any listing status) or
    // an admin, per the profiles RLS policies -- returns null for anyone
    // else now that the old blanket "public if active listing" policy is
    // gone.
    supabase.from("profiles").select("id, full_name, verified, avatar_url").eq("id", id).maybeSingle(),
    supabase
      .from("profile_feedback")
      .select(
        "id, sentiment, message, created_at, author:profiles!profile_feedback_author_id_fkey(full_name), replies:profile_feedback_replies(id, message, created_at)"
      )
      .eq("profile_id", id)
      .order("created_at", { ascending: false }),
  ]);

  // Falls back to the public-safe RPC for the general "viewing someone
  // else's seller profile" case -- same "has an active listing" condition
  // the old policy used, just enforced inside the function instead.
  const profile =
    directProfile ??
    (await supabase.rpc("get_public_seller_profile", { p_user_id: id }).then((r) => r.data?.[0] ?? null));

  if (!profile) notFound();

  const viewerId = userData.user?.id;
  const isOwner = viewerId === profile.id;
  const entries: FeedbackEntry[] = feedback ?? [];

  const counts = {
    positive: entries.filter((f) => f.sentiment === "positive").length,
    neutral: entries.filter((f) => f.sentiment === "neutral").length,
    negative: entries.filter((f) => f.sentiment === "negative").length,
  };

  const total = counts.positive + counts.neutral + counts.negative;

  return (
    <div className="flex flex-1 flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 space-y-4 px-4 py-8 sm:px-6">

        {/* Profile card */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-md">
          {/* Brand accent strip */}
          <div className="h-2 bg-brand" />
          <div className="flex items-center gap-4 p-6">
            <span className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand text-xl font-bold text-white ring-4 ring-brand-light">
              <AvatarContent avatarUrl={profile.avatar_url} initials={getInitials(profile.full_name) || "F"} sizes="64px" />
            </span>
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-1.5 text-lg font-bold text-neutral-800">
                {profile.full_name || "Flikax user"}
                {profile.verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">
                    <BadgeCheck className="size-3.5" />
                    Verified
                  </span>
                )}
              </p>
              <p className="text-sm text-neutral-500">Seller on Flikax</p>
              {total > 0 && (
                <p className="mt-1 text-xs font-medium text-neutral-400">{total} review{total !== 1 ? "s" : ""}</p>
              )}
            </div>
          </div>
        </div>

        {/* Sentiment summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center gap-1.5 rounded-2xl bg-white px-3 py-4 shadow-md">
            <span className="flex size-9 items-center justify-center rounded-full bg-green-100">
              <Smile className="size-5 text-green-600" />
            </span>
            <p className="text-lg font-extrabold text-green-700">{counts.positive}</p>
            <p className="text-xs font-medium text-neutral-500">Positive</p>
          </div>
          <div className="flex flex-col items-center gap-1.5 rounded-2xl bg-white px-3 py-4 shadow-md">
            <span className="flex size-9 items-center justify-center rounded-full bg-neutral-100">
              <Meh className="size-5 text-neutral-500" />
            </span>
            <p className="text-lg font-extrabold text-neutral-600">{counts.neutral}</p>
            <p className="text-xs font-medium text-neutral-500">Neutral</p>
          </div>
          <div className="flex flex-col items-center gap-1.5 rounded-2xl bg-white px-3 py-4 shadow-md">
            <span className="flex size-9 items-center justify-center rounded-full bg-red-100">
              <Frown className="size-5 text-red-500" />
            </span>
            <p className="text-lg font-extrabold text-red-600">{counts.negative}</p>
            <p className="text-xs font-medium text-neutral-500">Negative</p>
          </div>
        </div>

        {viewerId && !isOwner && <LeaveFeedbackForm profileId={profile.id} />}

        {!viewerId && (
          <p className="rounded-2xl bg-white p-5 text-sm text-neutral-500 shadow-md">
            <Link href={`/auth/login?redirect=/u/${profile.id}`} className="font-bold text-brand hover:underline">
              Log in
            </Link>{" "}
            to leave feedback for {profile.full_name || "this seller"}.
          </p>
        )}

        <FeedbackList entries={entries} isOwner={isOwner} profileId={profile.id} />
      </main>
      <SiteFooter />
    </div>
  );
}
