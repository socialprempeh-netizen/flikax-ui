"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { AvatarContent } from "@/components/avatar-content";
import { getInitials } from "@/lib/avatar";

// Client-side mirror of the server route's own checks (src/app/api/settings/
// avatar/route.ts) -- this doesn't replace that validation, it just fails
// fast with a clear message instead of making the round trip only to be
// rejected there.
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function AvatarUpload({
  initialAvatarUrl,
  fullName,
}: {
  initialAvatarUrl: string | null;
  fullName: string | null;
}) {
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const initials = getInitials(fullName) || "F";

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Reset immediately (not just on success) -- otherwise picking the same
    // file again after a failed upload wouldn't fire a change event at all.
    e.target.value = "";
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Use a JPG, PNG, or WEBP image.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError("File too large (max 5MB).");
      return;
    }

    setError(null);
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/settings/avatar", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setAvatarUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove() {
    setError(null);
    setUploading(true);
    try {
      const res = await fetch("/api/settings/avatar", { method: "DELETE" });
      if (!res.ok) throw new Error("Could not remove photo");
      setAvatarUrl(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove photo");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-md">
      <span className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-dark text-2xl font-bold text-white ring-4 ring-brand-light">
        {uploading ? (
          <Loader2 className="size-6 animate-spin" />
        ) : (
          <AvatarContent avatarUrl={avatarUrl} initials={initials} sizes="80px" />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-neutral-800">Profile photo</p>
        <p className="text-xs text-neutral-400">JPG, PNG or WEBP. Max 5MB.</p>

        <div className="mt-2 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex min-h-11 items-center gap-1.5 rounded-full border border-neutral-300 px-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
          >
            <Camera className="size-4" />
            {avatarUrl ? "Change photo" : "Upload photo"}
          </button>

          {avatarUrl && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={uploading}
              className="flex min-h-11 items-center gap-1 text-sm font-medium text-red-600 hover:underline disabled:opacity-60"
            >
              <Trash2 className="size-3.5" />
              Remove
            </button>
          )}
        </div>

        {error && (
          <p className="mt-1 text-xs text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
