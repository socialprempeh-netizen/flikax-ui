"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  X,
  ImagePlus,
  Loader2,
  CheckCircle2,
  MapPin,
  Tag,
  FileText,
  DollarSign,
  Phone,
  Image as ImageIcon,
  Video,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { GHANA_ALL_DISTRICTS } from "@/lib/locations";
import { getFieldsForCategory } from "@/lib/listing-fields";
import { toGhanaE164, toGhanaLocal } from "@/lib/phone";
import { VehicleSpecFields } from "@/components/listings/vehicle-spec-fields";
import { LocationPickerModal } from "@/components/location-picker-modal";

// Rendered via the dedicated cascading VehicleSpecFields component instead of
// the generic field loop below when the category is Vehicles.
const VEHICLE_CASCADE_KEYS = ["make", "model", "year", "trim"];

type Category = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
};

type ImageSlot = {
  id: string;
  previewUrl: string;
  status: "uploading" | "done" | "error";
  path?: string;
  phash?: string;
  blurScore?: number;
  width?: number;
  height?: number;
  error?: string;
  isExisting?: boolean;
};

export type ExistingListing = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  location: string;
  negotiable: string | null;
  category_id: string;
  attributes: Record<string, string | string[]>;
  video_url: string | null;
  contact_phone: string | null;
  images: { id: string; storage_path: string; url: string }[];
};

const MAX_IMAGES = 16;
const NEGOTIABLE_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "not_sure", label: "Not sure" },
];

// ─── Shared input class ───────────────────────────────────────────────────────
const INPUT =
  "w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm text-neutral-800 outline-none transition-colors focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/10 disabled:opacity-50";
const SELECT = INPUT + " appearance-none";

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 pb-3">
      <span className="flex size-7 items-center justify-center rounded-lg bg-black text-orange-400">
        {icon}
      </span>
      <span className="text-sm font-bold uppercase tracking-wide text-neutral-500">{label}</span>
    </div>
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepBar({ step }: { step: 1 | 2 }) {
  const steps = [
    { n: 1, label: "Item Details" },
    { n: 2, label: "Photos & Title" },
  ];
  return (
    <div className="flex items-center gap-0">
      {steps.map((s, i) => {
        const done = step > s.n;
        const active = step === s.n;
        return (
          <div key={s.n} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex size-8 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                  done
                    ? "bg-brand text-white"
                    : active
                    ? "bg-black text-white ring-4 ring-brand/20"
                    : "bg-neutral-200 text-neutral-500"
                }`}
              >
                {done ? <CheckCircle2 className="size-4" /> : s.n}
              </div>
              <span
                className={`text-xs font-semibold ${
                  active ? "text-neutral-800" : done ? "text-brand" : "text-neutral-400"
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`mx-3 mb-5 h-0.5 flex-1 transition-colors ${
                  step > 1 ? "bg-brand" : "bg-neutral-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function ListingForm({
  categories,
  existingListing,
  posterName,
  defaultContactPhone,
}: {
  categories: Category[];
  existingListing?: ExistingListing;
  posterName?: string | null;
  defaultContactPhone?: string | null;
}) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const isEditing = Boolean(existingListing);

  const parentCategories = categories.filter((c) => c.parent_id === null);
  const initialCategory = existingListing
    ? categories.find((c) => c.id === existingListing.category_id)
    : undefined;

  const [step, setStep] = useState<1 | 2>(1);
  const [parentId, setParentId] = useState(initialCategory?.parent_id ?? "");
  const [categoryId, setCategoryId] = useState(existingListing?.category_id ?? "");
  const [attributes, setAttributes] = useState<Record<string, string | string[]>>(
    existingListing?.attributes ?? {}
  );
  const [description, setDescription] = useState(existingListing?.description ?? "");
  const [price, setPrice] = useState(existingListing ? String(existingListing.price) : "");
  const [negotiable, setNegotiable] = useState(existingListing?.negotiable ?? "not_sure");
  const [contactPhoneRaw, setContactPhoneRaw] = useState(
    toGhanaLocal(existingListing?.contact_phone ?? defaultContactPhone)
  );

  const [title, setTitle] = useState(existingListing?.title ?? "");
  const [location, setLocation] = useState(existingListing?.location ?? GHANA_ALL_DISTRICTS[0].name);
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState(existingListing?.video_url ?? "");
  const [images, setImages] = useState<ImageSlot[]>(
    existingListing?.images.map((img) => ({
      id: img.id,
      previewUrl: img.url,
      status: "done" as const,
      path: img.storage_path,
      isExisting: true,
    })) ?? []
  );
  const [removedExistingIds, setRemovedExistingIds] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [posted, setPosted] = useState(false);

  const childCategories = categories.filter((c) => c.parent_id === parentId);
  const parentCategory = categories.find((c) => c.id === parentId);
  const selectedCategory = categories.find((c) => c.id === categoryId);
  const isVehicles = parentCategory?.slug === "vehicles";
  const dynamicFields = useMemo(
    () => getFieldsForCategory(parentCategory?.slug),
    [parentCategory]
  );
  const genericFields = isVehicles
    ? dynamicFields.filter((field) => !VEHICLE_CASCADE_KEYS.includes(field.key))
    : dynamicFields;

  function setAttribute(key: string, value: string) {
    setAttributes((prev) => ({ ...prev, [key]: value }));
  }

  function toggleTagAttribute(key: string, tag: string) {
    setAttributes((prev) => {
      const current = Array.isArray(prev[key]) ? (prev[key] as string[]) : [];
      const next = current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag];
      return { ...prev, [key]: next };
    });
  }

  async function uploadOne(file: File, accessToken: string | undefined) {
    const MAX_ATTEMPTS = 2;
    let lastBody: { error?: string } = {};
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/listings/images", {
        method: "POST",
        body: formData,
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      });
      const body = await res.json();
      if (res.ok) return { ok: true as const, body };
      lastBody = body;
      if (res.status !== 401 || attempt === MAX_ATTEMPTS) break;
      await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
    }
    return { ok: false as const, body: lastBody };
  }

  async function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    const files = Array.from(fileList).slice(0, MAX_IMAGES - images.length);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const accessToken = session?.access_token;

    for (const file of files) {
      const id = crypto.randomUUID();
      const previewUrl = URL.createObjectURL(file);
      setImages((prev) => [...prev, { id, previewUrl, status: "uploading" }]);

      try {
        const result = await uploadOne(file, accessToken);
        if (!result.ok) {
          setImages((prev) =>
            prev.map((img) =>
              img.id === id ? { ...img, status: "error", error: result.body.error } : img
            )
          );
          continue;
        }
        setImages((prev) =>
          prev.map((img) =>
            img.id === id
              ? {
                  ...img,
                  status: "done",
                  path: result.body.path,
                  phash: result.body.phash,
                  blurScore: result.body.blurScore,
                  width: result.body.width,
                  height: result.body.height,
                }
              : img
          )
        );
      } catch {
        setImages((prev) =>
          prev.map((img) =>
            img.id === id ? { ...img, status: "error", error: "Upload failed" } : img
          )
        );
      }
    }
  }

  function removeImage(id: string) {
    setImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target?.isExisting) {
        setRemovedExistingIds((ids) => [...ids, id]);
      }
      return prev.filter((img) => img.id !== id);
    });
  }

  function handleNext(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!categoryId) {
      setError("Choose a category and subcategory.");
      return;
    }
    for (const field of dynamicFields) {
      if (!field.required) continue;
      const value = attributes[field.key];
      const isEmpty = Array.isArray(value) ? value.length === 0 : !value?.trim();
      if (isEmpty) {
        setError(`${field.label} is required.`);
        return;
      }
    }
    const priceValue = Number(price);
    if (!Number.isFinite(priceValue) || priceValue < 0) {
      setError("Enter a valid price.");
      return;
    }
    if (!toGhanaE164(contactPhoneRaw)) {
      setError("Enter a valid Ghana contact phone number, e.g. 024 123 4567.");
      return;
    }
    setError(null);
    setStep(2);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const uploadedImages = images.filter((img) => img.status === "done" && img.path);
    if (uploadedImages.length === 0) {
      setError("Add at least one photo.");
      return;
    }
    if (!title.trim()) {
      setError("Enter a title.");
      return;
    }

    setSubmitting(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSubmitting(false);
      router.push("/auth/login");
      return;
    }

    const payload = {
      user_id: user.id,
      category_id: categoryId,
      title: title.trim(),
      description: description.trim() || null,
      price: Number(price),
      location,
      negotiable,
      attributes,
      video_url: videoUrl.trim() || null,
      contact_phone: toGhanaE164(contactPhoneRaw),
    };

    let listingId = existingListing?.id;

    if (isEditing && listingId) {
      const { error: updateError } = await supabase
        .from("listings")
        .update(payload)
        .eq("id", listingId);
      if (updateError) {
        setSubmitting(false);
        setError(updateError.message);
        return;
      }
      if (removedExistingIds.length > 0) {
        await supabase.from("listing_images").delete().in("id", removedExistingIds);
      }
      const newImages = uploadedImages.filter((img) => !img.isExisting);
      const existingCount = uploadedImages.length - newImages.length;
      if (newImages.length > 0) {
        const { error: imagesError } = await supabase.from("listing_images").insert(
          newImages.map((img, index) => ({
            listing_id: listingId!,
            storage_path: img.path!,
            position: existingCount + index,
            phash: img.phash ?? null,
            blur_score: img.blurScore ?? null,
            width: img.width ?? null,
            height: img.height ?? null,
          }))
        );
        if (imagesError) {
          setSubmitting(false);
          setError(imagesError.message);
          return;
        }
      }
    } else {
      const { data: listing, error: listingError } = await supabase
        .from("listings")
        .insert(payload)
        .select()
        .single();
      if (listingError || !listing) {
        setSubmitting(false);
        setError(listingError?.message ?? "Could not create listing.");
        return;
      }
      listingId = listing.id;
      const { error: imagesError } = await supabase.from("listing_images").insert(
        uploadedImages.map((img, index) => ({
          listing_id: listingId!,
          storage_path: img.path!,
          position: index,
          phash: img.phash ?? null,
          blur_score: img.blurScore ?? null,
          width: img.width ?? null,
          height: img.height ?? null,
        }))
      );
      if (imagesError) {
        setSubmitting(false);
        setError(imagesError.message);
        return;
      }
    }

    fetch("/api/listings/revalidate", { method: "POST" }).catch(() => {});
    setSubmitting(false);
    setPosted(true);
  }

  // ─── Success screen ──────────────────────────────────────────────────────────
  if (posted) {
    return (
      <div className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.1)]">
        {/* Top accent strip */}
        <div className="h-1.5 w-full bg-gradient-to-r from-black via-neutral-800 to-brand" />
        <div className="flex flex-col items-center px-8 py-12 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-brand/10 ring-8 ring-brand/5">
            <CheckCircle2 className="size-8 text-brand" />
          </div>
          <h1 className="mt-5 text-2xl font-extrabold text-neutral-900">
            {isEditing ? "Listing updated!" : "Ad posted successfully!"}
          </h1>
          <p className="mt-2 max-w-sm text-sm text-neutral-500">
            {isEditing
              ? "Your changes have been saved and are now live."
              : "Your listing is live on the homepage and searchable by thousands of buyers across Ghana."}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-xl bg-black px-6 py-2.5 text-sm font-bold text-white transition hover:bg-neutral-800"
            >
              View my adverts
            </Link>
            <Link
              href="/sell"
              className="rounded-xl bg-brand px-6 py-2.5 text-sm font-bold text-white transition hover:bg-brand-dark"
            >
              Post another ad
            </Link>
            <Link
              href="/"
              className="rounded-xl border border-neutral-200 px-6 py-2.5 text-sm font-bold text-neutral-700 transition hover:border-brand hover:text-brand"
            >
              Back to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main form ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Page title + step bar */}
      <div>
        <h1 className="text-xl font-extrabold text-neutral-900">
          {isEditing ? "Edit listing" : "Post a free ad"}
        </h1>
        <p className="mt-0.5 text-sm text-neutral-500">
          {isEditing ? "Update your listing details below." : "Reach thousands of buyers across Ghana — no fees."}
        </p>
      </div>

      <StepBar step={step} />

      {/* ── STEP 1 ── */}
      {step === 1 && (
        <form onSubmit={handleNext} className="space-y-0 overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
          {/* Card header accent */}
          <div className="h-1.5 bg-gradient-to-r from-black via-neutral-800 to-brand" />

          <div className="space-y-7 p-6 sm:p-8">

            {/* ── Category ── */}
            <section>
              <SectionHeader icon={<Tag className="size-3.5" />} label="Category" />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-neutral-500">
                    Main category <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={parentId}
                    onChange={(e) => {
                      setParentId(e.target.value);
                      setCategoryId("");
                      setAttributes({});
                    }}
                    className={SELECT}
                  >
                    <option value="" disabled>Select category…</option>
                    {parentCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-neutral-500">
                    Subcategory <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    disabled={!parentId}
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className={SELECT}
                  >
                    <option value="" disabled>
                      {parentId ? "Select subcategory…" : "Choose category first"}
                    </option>
                    {childCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {/* ── Dynamic / vehicle fields ── */}
            {isVehicles && categoryId && (
              <section className="border-t border-neutral-100 pt-7">
                <SectionHeader icon={<Tag className="size-3.5" />} label="Vehicle details" />
                <VehicleSpecFields attributes={attributes} setAttribute={setAttribute} />
              </section>
            )}

            {genericFields.length > 0 && categoryId && (
              <section className="border-t border-neutral-100 pt-7">
                <SectionHeader icon={<Tag className="size-3.5" />} label="Item details" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {genericFields.map((field) => {
                    const scalarValue = (attributes[field.key] as string | undefined) ?? "";
                    const tagValues = Array.isArray(attributes[field.key])
                      ? (attributes[field.key] as string[])
                      : [];

                    return (
                      <div
                        key={field.key}
                        className={
                          field.type === "tags"
                            ? "col-span-full"
                            : field.type === "boolean"
                            ? "flex items-center gap-3 sm:col-span-1"
                            : ""
                        }
                      >
                        {field.type !== "boolean" && (
                          <label className="mb-1.5 block text-xs font-semibold text-neutral-500">
                            {field.label}
                            {field.required && <span className="ml-0.5 text-red-500">*</span>}
                          </label>
                        )}

                        {field.type === "text" && (
                          <input
                            type="text"
                            required={field.required}
                            value={scalarValue}
                            onChange={(e) => setAttribute(field.key, e.target.value)}
                            className={INPUT}
                          />
                        )}
                        {field.type === "number" && (
                          <input
                            type="number"
                            required={field.required}
                            value={scalarValue}
                            onChange={(e) => setAttribute(field.key, e.target.value)}
                            className={INPUT}
                          />
                        )}
                        {field.type === "select" && (
                          <select
                            required={field.required}
                            value={scalarValue}
                            onChange={(e) => setAttribute(field.key, e.target.value)}
                            className={SELECT}
                          >
                            <option value="" disabled>Select {field.label.toLowerCase()}…</option>
                            {field.options?.map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        )}
                        {field.type === "boolean" && (
                          <>
                            <input
                              type="checkbox"
                              id={`attr-${field.key}`}
                              checked={scalarValue === "yes"}
                              onChange={(e) => setAttribute(field.key, e.target.checked ? "yes" : "no")}
                              className="size-4 rounded accent-brand"
                            />
                            <label
                              htmlFor={`attr-${field.key}`}
                              className="text-sm font-medium text-neutral-700"
                            >
                              {field.label}
                            </label>
                          </>
                        )}
                        {field.type === "tags" && (
                          <div className="flex flex-wrap gap-2">
                            {field.options?.map((opt) => {
                              const isSelected = tagValues.includes(opt);
                              return (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => toggleTagAttribute(field.key, opt)}
                                  aria-pressed={isSelected}
                                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                                    isSelected
                                      ? "border-brand bg-brand text-white"
                                      : "border-neutral-200 bg-neutral-50 text-neutral-600 hover:border-brand/40 hover:text-brand"
                                  }`}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ── Description ── */}
            <section className="border-t border-neutral-100 pt-7">
              <SectionHeader icon={<FileText className="size-3.5" />} label="Description" />
              <label className="mb-1.5 block text-xs font-semibold text-neutral-500">
                What are you selling?
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the condition, key features, reason for selling, included accessories…"
                className={INPUT + " resize-none"}
              />
              <p className="mt-1.5 text-xs text-neutral-400">
                A detailed description gets 3× more enquiries.
              </p>
            </section>

            {/* ── Pricing ── */}
            <section className="border-t border-neutral-100 pt-7">
              <SectionHeader icon={<DollarSign className="size-3.5" />} label="Pricing" />
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-neutral-500">
                    Price (GHS) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-sm font-bold text-neutral-400">
                      GH₵
                    </span>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      required
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0.00"
                      className={INPUT + " pl-12"}
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-neutral-500">
                    Open to negotiation?
                  </label>
                  <div className="flex gap-2">
                    {NEGOTIABLE_OPTIONS.map((opt) => (
                      <label
                        key={opt.value}
                        className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-colors ${
                          negotiable === opt.value
                            ? "border-brand bg-brand text-white"
                            : "border-neutral-200 bg-neutral-50 text-neutral-600 hover:border-brand/40"
                        }`}
                      >
                        <input
                          type="radio"
                          name="negotiable"
                          value={opt.value}
                          checked={negotiable === opt.value}
                          onChange={(e) => setNegotiable(e.target.value)}
                          className="sr-only"
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* ── Contact ── */}
            <section className="border-t border-neutral-100 pt-7">
              <SectionHeader icon={<Phone className="size-3.5" />} label="Contact" />
              <label className="mb-1.5 block text-xs font-semibold text-neutral-500">
                Contact phone number <span className="text-red-500">*</span>
              </label>
              <div className="flex overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50 transition-colors focus-within:border-brand focus-within:bg-white focus-within:ring-2 focus-within:ring-brand/10">
                <span className="flex items-center border-r border-neutral-200 bg-neutral-100 px-3.5 text-sm font-semibold text-neutral-500">
                  +233
                </span>
                <input
                  type="tel"
                  inputMode="tel"
                  required
                  value={contactPhoneRaw}
                  onChange={(e) => setContactPhoneRaw(e.target.value)}
                  placeholder="024 123 4567"
                  className="min-w-0 flex-1 bg-transparent px-3.5 py-2.5 text-sm text-neutral-800 outline-none"
                />
              </div>
              <p className="mt-1.5 text-xs text-neutral-400">
                Buyers see this when they tap &ldquo;Contact Seller.&rdquo; Can differ from your account phone.
              </p>
              {posterName && (
                <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-black text-xs font-bold text-white">
                    {posterName.charAt(0).toUpperCase()}
                  </div>
                  <p className="text-xs text-neutral-500">
                    Posting as{" "}
                    <span className="font-semibold text-neutral-800">{posterName}</span>. Your
                    phone number stays hidden until a buyer starts a chat.
                  </p>
                </div>
              )}
            </section>

            {/* ── Error + CTA ── */}
            {error && (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-black py-3.5 text-sm font-bold text-white transition hover:bg-neutral-800 active:scale-[0.99]"
            >
              Continue to Photos &amp; Title
              <ChevronRight className="size-4" />
            </button>
          </div>
        </form>
      )}

      {/* ── STEP 2 ── */}
      {step === 2 && (
        <form
          onSubmit={handleSubmit}
          className="space-y-0 overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.08)]"
        >
          <div className="h-1.5 bg-gradient-to-r from-black via-neutral-800 to-brand" />

          <div className="space-y-7 p-6 sm:p-8">

            {/* ── Title & Location ── */}
            <section>
              <SectionHeader icon={<FileText className="size-3.5" />} label="Title & Location" />
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-neutral-500">
                    Ad title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. iPhone 13 Pro 256GB – Excellent condition"
                    className={INPUT}
                  />
                  <p className="mt-1.5 text-xs text-neutral-400">
                    Be specific — include model, size, colour, or condition.
                  </p>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-neutral-500">
                    Location <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setLocationPickerOpen(true)}
                    className="flex w-full items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-left text-sm text-neutral-800 transition-colors outline-none hover:border-brand/40 focus:border-brand focus:ring-2 focus:ring-brand/10"
                  >
                    <span className="flex items-center gap-2">
                      <MapPin className="size-4 text-brand" />
                      {location}
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-neutral-400" />
                  </button>
                </div>

                {/* Category (read-only with Change) */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-neutral-500">
                    Category
                  </label>
                  <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm">
                    <span className="text-neutral-700">
                      {parentCategory?.name}
                      {selectedCategory ? ` › ${selectedCategory.name}` : ""}
                    </span>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-xs font-bold text-brand hover:underline"
                    >
                      Change
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* ── Photos ── */}
            <section className="border-t border-neutral-100 pt-7">
              <div className="mb-3 flex items-center justify-between">
                <SectionHeader icon={<ImageIcon className="size-3.5" />} label="Photos" />
                <span className="text-xs text-neutral-400">
                  {images.length}/{MAX_IMAGES} photos
                </span>
              </div>

              {/* Drop zone (shown when no images yet) */}
              {images.length === 0 && (
                <label className="mb-4 flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50 py-10 text-center transition-colors hover:border-brand/40 hover:bg-brand/5 cursor-pointer">
                  <div className="flex size-12 items-center justify-center rounded-full bg-neutral-100">
                    <ImagePlus className="size-6 text-neutral-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-neutral-700">Upload photos</p>
                    <p className="mt-0.5 text-xs text-neutral-400">
                      JPEG, PNG or WebP · up to {MAX_IMAGES} photos · auto-watermarked
                    </p>
                  </div>
                  <span className="rounded-lg bg-black px-5 py-2 text-xs font-bold text-white hover:bg-neutral-800">
                    Choose files
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFiles(e.target.files)}
                  />
                </label>
              )}

              {/* Image grid */}
              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {images.map((img, i) => (
                    <div
                      key={img.id}
                      className="relative aspect-square overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.previewUrl} alt="" className="size-full object-cover" />
                      {i === 0 && (
                        <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-bold text-white">
                          COVER
                        </span>
                      )}
                      {img.status === "uploading" && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                          <Loader2 className="size-5 animate-spin text-white" />
                        </div>
                      )}
                      {img.status === "error" && (
                        <div className="absolute inset-0 flex items-center justify-center bg-red-600/80 p-2 text-center text-[10px] font-medium text-white">
                          {img.error ?? "Failed"}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(img.id)}
                        aria-label="Remove photo"
                        className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}

                  {images.length < MAX_IMAGES && (
                    <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50 text-neutral-400 transition-colors hover:border-brand/40 hover:text-brand">
                      <ImagePlus className="size-5" />
                      <span className="text-xs font-medium">Add more</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        className="hidden"
                        onChange={(e) => handleFiles(e.target.files)}
                      />
                    </label>
                  )}
                </div>
              )}
            </section>

            {/* ── Video link ── */}
            <section className="border-t border-neutral-100 pt-7">
              <SectionHeader icon={<Video className="size-3.5" />} label="Video (optional)" />
              <label className="mb-1.5 block text-xs font-semibold text-neutral-500">
                YouTube or video link
              </label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=…"
                className={INPUT}
              />
              <p className="mt-1.5 text-xs text-neutral-400">
                A short demo video can significantly increase buyer interest.
              </p>
            </section>

            {/* ── Error + Submit ── */}
            {error && (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-xl border border-neutral-200 px-6 py-3 text-sm font-bold text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50"
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-bold text-white transition hover:bg-brand-dark disabled:opacity-60 active:scale-[0.99]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {isEditing ? "Saving…" : "Publishing…"}
                  </>
                ) : isEditing ? (
                  "Save changes"
                ) : (
                  "Publish ad for free"
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      <LocationPickerModal
        open={locationPickerOpen}
        onClose={() => setLocationPickerOpen(false)}
        onSelect={(name) => name && setLocation(name)}
        allowBroadSelection={false}
      />
    </div>
  );
}
