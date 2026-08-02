import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { ListingForm } from "@/components/listings/listing-form";

// Entry point for "post an ad". This is just a server-rendered shell: it
// gates on auth, checks for a posting suspension, and preloads the category
// tree + poster profile so <ListingForm> can render without its own loading
// state. All of the actual listing-creation and image-upload logic lives
// client-side in listing-form.tsx.
export default async function SellPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await getUser();

  if (!user) {
    redirect("/auth/login?redirect=/sell");
  }

  const [{ data: categories }, { data: profile }] = await Promise.all([
    supabase.from("categories").select("id, name, slug, parent_id").order("name"),
    supabase.from("profiles").select("full_name, suspended_until").eq("id", user.id).maybeSingle(),
  ]);

  const isSuspended = Boolean(profile?.suspended_until && new Date(profile.suspended_until) > new Date());

  return (
    <div className="flex flex-1 flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6">
        {isSuspended ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
            <h1 className="text-lg font-bold text-amber-800">Posting is temporarily suspended</h1>
            <p className="mt-2 text-sm text-amber-700">
              Your account can&apos;t post new listings until{" "}
              {new Date(profile!.suspended_until!).toLocaleDateString()}. You can still browse and manage
              existing listings.
            </p>
          </div>
        ) : (
          <ListingForm
            categories={categories ?? []}
            posterName={profile?.full_name ?? user.phone}
            defaultContactPhone={user.phone}
          />
        )}
      </main>
    </div>
  );
}
