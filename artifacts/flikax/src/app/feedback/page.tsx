import { MessageSquareWarning } from "lucide-react";
import { getUser } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BottomTabBar } from "@/components/bottom-tab-bar";
import { FeedbackForm } from "@/components/feedback/feedback-form";

export const metadata = {
  title: "Leave Feedback | Flikax",
};

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ listingId?: string }>;
}) {
  const { listingId } = await searchParams;

  const [{ data: userData }, listingTitle] = await Promise.all([
    getUser(),
    listingId ? fetchListingTitle(listingId) : Promise.resolve(null),
  ]);

  const defaultCategory = listingTitle ? "Listing issue" : "General feedback";
  const defaultSubject = listingTitle ? `Feedback on listing: ${listingTitle}` : "";

  return (
    <div className="flex flex-1 flex-col bg-background pb-16 lg:pb-0">
      <SiteHeader />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8 sm:px-6">
        <div className="border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
          <span className="flex size-11 items-center justify-center rounded-full bg-brand-light text-brand-dark">
            <MessageSquareWarning className="size-5" />
          </span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-neutral-900">Leave Feedback</h1>
          <p className="mt-1.5 text-sm text-neutral-500">
            Spotted a bug, have an idea, or something about a listing doesn&apos;t look right? Tell us about it
            below.
          </p>

          {listingTitle && (
            <p className="mt-4 truncate bg-brand-light px-3 py-2 text-sm font-medium text-brand-dark">
              Re: {listingTitle}
            </p>
          )}

          <div className="mt-6">
            <FeedbackForm
              defaultCategory={defaultCategory}
              defaultSubject={defaultSubject}
              defaultEmail={userData.user?.email ?? ""}
              listingId={listingId}
            />
          </div>
        </div>

        <p className="mt-4 text-center text-sm text-neutral-400">
          Prefer email?{" "}
          <a href="mailto:feedback@flikax.com" className="font-medium text-brand-dark hover:underline">
            feedback@flikax.com
          </a>
        </p>
      </main>
      <SiteFooter />
      <BottomTabBar activeHref="" />
    </div>
  );
}

async function fetchListingTitle(listingId: string): Promise<string | null> {
  const supabase = createPublicClient();
  const { data } = await supabase.from("listings").select("title").eq("id", listingId).maybeSingle();
  return data?.title ?? null;
}
