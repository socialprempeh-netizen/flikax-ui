import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import sharp from "sharp";
import { createClient, getUser } from "@/lib/supabase/server";

// Profile-photo upload/removal for Settings > Personal details. Unlike the
// "post an ad" photo pipeline (src/app/api/listings/images/route.ts, which
// splits upload-per-file from the later listing-row write, and juggles a
// bearer token to survive a batch of concurrent requests), this is a single
// file tied directly to one row (profiles.avatar_url) -- upload and persist
// happen together in one request, and there's no batching race to guard
// against, so the plain cookie-scoped server client is enough.
export const runtime = "nodejs";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
// Square output, resized+cropped server-side regardless of what shape the
// original upload was -- no interactive cropping UI (drag/zoom) client-side.
// Every avatar-shaped spot in the app renders this as a circle already, so
// an off-center crop is the only real downside, and that's a small enough
// cost against not shipping a whole cropper library for this.
const AVATAR_SIZE = 512;

function extractStoragePath(avatarUrl: string | null | undefined): string | null {
  if (!avatarUrl) return null;
  const marker = "/avatars/";
  const index = avatarUrl.indexOf(marker);
  return index === -1 ? null : avatarUrl.slice(index + marker.length);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Unsupported file type -- use JPG, PNG, or WEBP" }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
  }

  const inputBuffer = Buffer.from(await file.arrayBuffer());

  let resized: Buffer;
  try {
    resized = await sharp(inputBuffer)
      // .rotate() with no args applies whatever EXIF orientation tag the
      // source has -- without it, a photo taken on a phone held sideways
      // gets center-cropped in the *pre-rotation* orientation, unlike
      // however the browser/OS displayed it to the person uploading it.
      .rotate()
      .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: "cover" })
      .webp({ quality: 85 })
      .toBuffer();
  } catch (err) {
    console.error("Avatar processing failed:", err);
    return NextResponse.json({ error: "Could not process image" }, { status: 400 });
  }

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  // Namespaced under the uploader's own id (Storage RLS checks this via
  // storage.foldername) and randomUUID'd so a re-upload never collides with
  // -- or gets served from a stale cache under -- the previous file's path.
  const path = `${user.id}/${randomUUID()}.webp`;
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, resized, { contentType: "image/webp", upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);

  const { error: updateError } = await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);

  if (updateError) {
    // The row update failed, so nothing points at the file we just
    // uploaded -- remove it rather than leaving an orphan in Storage.
    await supabase.storage.from("avatars").remove([path]);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Best-effort: the new photo is already live and correctly saved above,
  // so a failure to clean up the *old* one isn't worth failing the request
  // over -- it'd just be an orphaned file, not a visible bug.
  const oldPath = extractStoragePath(existingProfile?.avatar_url);
  if (oldPath) {
    await supabase.storage.from("avatars").remove([oldPath]).catch(() => {});
  }

  return NextResponse.json({ url: publicUrl });
}

export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: profile } = await supabase.from("profiles").select("avatar_url").eq("id", user.id).maybeSingle();

  const { error: updateError } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id);
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const oldPath = extractStoragePath(profile?.avatar_url);
  if (oldPath) {
    await supabase.storage.from("avatars").remove([oldPath]).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
