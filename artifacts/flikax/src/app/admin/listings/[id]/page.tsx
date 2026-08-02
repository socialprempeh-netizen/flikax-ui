import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Eye } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { resolveListingImageUrl } from "@/lib/images";
import { isRecentlyBumped } from "@/lib/premium-plans";
import { getFieldsForCategory, HEADLINE_FIELD_KEYS } from "@/lib/listing-fields";
import { ADMIN_STATUS_LABELS, ADMIN_STATUS_STYLES, isListingExpired } from "@/lib/admin-listings";
import { ListingGallery } from "@/components/listings/listing-gallery";
import { ListingDetailActions } from "@/components/admin/listing-detail-actions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const currency = new Intl.NumberFormat("en-GH", {
  style: "currency",
  currency: "GHS",
  maximumFractionDigits: 0,
});

export default async function AdminListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: listing }, { data: categories }] = await Promise.all([
    supabase
      .from("listings")
      .select(
        "id, user_id, category_id, title, description, price, location, status, created_at, updated_at, attributes, negotiable, declined_reason, video_url, is_featured, featured_until, views, bumped_at, expires_at, short_id, categories(id, name, slug, parent_id), listing_images(id, storage_path, position), profiles(full_name, phone, id)"
      )
      .eq("id", id)
      .maybeSingle(),
    supabase.from("categories").select("id, name").order("name"),
  ]);

  if (!listing) notFound();

  // contact_phone can no longer be selected directly off listings -- this
  // call is authorized by the is_admin branch inside the function.
  const { data: listingContactPhone } = await supabase.rpc("get_listing_contact_phone", { p_listing_id: listing.id });

  const images = [...(listing.listing_images ?? [])]
    .sort((a, b) => a.position - b.position)
    .map((img) => resolveListingImageUrl(supabase, img.storage_path));

  const category = listing.categories;
  let topLevelSlug = category?.slug;
  if (category?.parent_id) {
    const { data: parent } = await supabase
      .from("categories")
      .select("slug")
      .eq("id", category.parent_id)
      .maybeSingle();
    if (parent) topLevelSlug = parent.slug;
  }

  const fields = getFieldsForCategory(topLevelSlug ?? undefined);
  const attributes = (listing.attributes ?? {}) as Record<string, string | string[]>;

  const specs = fields
    .filter((field) => field.type !== "tags")
    .map((field) => ({ key: field.key, label: field.label, value: attributes[field.key] as string | undefined }))
    .filter((spec) => spec.value);

  const tagSpecs = fields
    .filter((field) => field.type === "tags")
    .map((field) => ({
      key: field.key,
      label: field.label,
      values: (attributes[field.key] as string[] | undefined) ?? [],
    }))
    .filter((spec) => spec.values.length > 0);

  const headlineKeys = topLevelSlug ? (HEADLINE_FIELD_KEYS[topLevelSlug] ?? []) : [];
  const headlineSpecs = specs.filter((spec) => headlineKeys.includes(spec.key));

  const now = Date.now();
  const isFeatured =
    listing.is_featured && (!listing.featured_until || new Date(listing.featured_until).getTime() > now);
  const isBumped = isRecentlyBumped(listing.bumped_at);
  const isExpired = isListingExpired(listing.status, listing.expires_at);

  return (
    <div>
      <Link
        href="/admin/listings"
        className="mb-4 flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-brand"
      >
        <ChevronLeft className="size-4" />
        Back to listings
      </Link>

      <div className="grid gap-6 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <ListingGallery images={images} title={listing.title} />

          <Card className="mt-6 gap-0 rounded-2xl p-5 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={ADMIN_STATUS_STYLES[listing.status] ?? "bg-slate-100 text-slate-600"}>
                {ADMIN_STATUS_LABELS[listing.status] ?? listing.status}
              </Badge>
              {isExpired && <Badge className="bg-orange-100 text-orange-700">Expired</Badge>}
              {isFeatured && <Badge className="bg-amber-100 text-amber-700">Featured</Badge>}
              {isBumped && <Badge className="bg-blue-100 text-blue-700">Bumped</Badge>}
            </div>

            <h1 className="mt-2 text-2xl font-bold text-slate-800">{listing.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <span>{listing.location}</span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Eye className="size-4" />
                {listing.views} views
              </span>
              {listing.expires_at && (
                <>
                  <span>·</span>
                  <span>Expires {new Date(listing.expires_at).toLocaleDateString()}</span>
                </>
              )}
            </div>

            <p className="mt-3 text-3xl font-extrabold text-brand">{currency.format(listing.price)}</p>

            {listing.declined_reason && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                Decline reason: {listing.declined_reason}
              </p>
            )}

            {headlineSpecs.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-4 border-t border-slate-100 pt-4 text-sm text-slate-700">
                {headlineSpecs.map((spec) => (
                  <span key={spec.key} className="font-medium">
                    {spec.label}: {spec.value}
                  </span>
                ))}
              </div>
            )}

            {specs.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-3">
                {specs.map((spec) => (
                  <div key={spec.key}>
                    <p className="text-sm font-semibold text-slate-800">{spec.value}</p>
                    <p className="text-xs uppercase tracking-wide text-slate-400">{spec.label}</p>
                  </div>
                ))}
              </div>
            )}

            {tagSpecs.map((spec) => (
              <div key={spec.key} className="mt-4 border-t border-slate-100 pt-4">
                <h2 className="mb-2 text-sm font-bold text-slate-800">{spec.label}</h2>
                <div className="flex flex-wrap gap-2">
                  {spec.values.map((value) => (
                    <Badge key={value} className="bg-slate-100 font-medium text-slate-700">
                      {value}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}

            {listing.description && (
              <div className="mt-4 border-t border-slate-100 pt-4">
                <h2 className="mb-2 text-sm font-bold text-slate-800">Description</h2>
                <p className="whitespace-pre-wrap text-sm text-slate-600">{listing.description}</p>
              </div>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-4 sm:col-span-1">
          <Card className="gap-2 rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-bold text-slate-800">Seller</h2>
            <p className="text-sm text-slate-700">{listing.profiles?.full_name || "Unnamed user"}</p>
            {(listingContactPhone || listing.profiles?.phone) && (
              <p className="text-sm text-slate-500">{listingContactPhone || listing.profiles?.phone}</p>
            )}
            {listing.profiles?.id && (
              <Link
                href={`/admin/users/${listing.profiles.id}`}
                className="inline-block text-sm font-medium text-brand hover:underline"
              >
                View user profile
              </Link>
            )}
          </Card>

          <ListingDetailActions
            listingId={listing.id}
            status={listing.status}
            categoryId={listing.category_id}
            categories={categories ?? []}
            isFeatured={isFeatured}
            isBumped={isBumped}
          />
        </div>
      </div>
    </div>
  );
}
