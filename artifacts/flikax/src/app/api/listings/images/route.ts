import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { createClient, getUser } from "@/lib/supabase/server";
import { watermarkImage } from "@/lib/watermark";
import { computeAverageHash, computeBlurScore } from "@/lib/image-hash";

// Per-photo upload endpoint for the "post an ad" flow. listing-form.tsx calls
// this once per file (see uploadOne/handleFiles), not once per listing, so a
// single ad with 10 photos means 10 requests here in quick succession. Each
// call: authenticates the caller, validates the raw upload, watermarks it
// server-side (see watermarkImage's own why-comment for why this can't be
// done client-side), computes a perceptual hash + blur score for later
// duplicate/low-quality detection, then pushes the processed file to the
// "listing-images" Storage bucket. The listing row + listing_images rows
// themselves are written later, directly from the client, once all photos
// for the ad have finished uploading.
export const runtime = "nodejs";

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request: Request) {
  const supabase = await createClient();

  // A batch of photos means many of these requests fire back-to-back. Each
  // one previously did its own cookie-based getUser(), which independently
  // decides whether the session needs refreshing — with 10+ requests in a
  // few seconds, those refresh attempts raced each other (and Supabase's own
  // refresh-token rate limit), so some requests in the middle of a batch
  // failed even though nothing the user did was concurrent. The client now
  // fetches its access token once per batch and sends it as a Bearer token;
  // validating an explicit token is a stateless check with no refresh
  // involved, so none of these requests can race one another. Cookie-based
  // getUser() stays as the fallback for any other caller of this route.
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const {
    data: { user },
  } = bearerToken ? await supabase.auth.getUser(bearerToken) : await getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // supabase.auth.getUser(bearerToken) only verifies who the caller is — it
  // doesn't change which credentials the rest of this `supabase` client's
  // requests (like the storage upload below) carry. Those still ride on
  // whatever cookie session `createClient()` picked up, which can be stale
  // or absent in exactly the scenario the bearer token exists to route
  // around (batch uploads, races). Storage RLS checks `auth.uid()` against
  // the request's own JWT, so a cookie-less/stale-cookie request would
  // authenticate as the right user above and then get rejected as anonymous
  // on the actual upload. A token-scoped client carries the verified bearer
  // token on every request it makes, independent of cookie state.
  const storageClient = bearerToken
    ? createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        global: { headers: { Authorization: `Bearer ${bearerToken}` } },
        auth: { persistSession: false },
      })
    : supabase;

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "File too large (max 8MB)" }, { status: 400 });
  }

  const inputBuffer = Buffer.from(await file.arrayBuffer());

  // Watermarking (and the hash/blur checks below) run here, server-side,
  // rather than in the browser before upload: it keeps the Flikax mark and
  // the sharp/libvips processing off the client bundle, guarantees every
  // photo that reaches Storage is stamped no matter what client posted it
  // (a raw API call could otherwise skip a browser-only step entirely), and
  // avoids trusting a client-reported hash/blur score that a scraper could
  // fake to get past duplicate/quality checks.
  let watermarked: Buffer;
  let phash: string;
  let blurScore: number;
  let width: number | undefined;
  let height: number | undefined;
  try {
    watermarked = await watermarkImage(inputBuffer);
    // watermarkImage() resizes (max 1600px) and stamps the logo, so these are
    // the *stored* image's real dimensions -- not the original upload's,
    // which is what listing cards need to render at their true aspect ratio.
    ({ width, height } = await sharp(watermarked).metadata());
    // Hashed/scored from the *original* upload, not the watermarked output —
    // the watermark and resize would otherwise shift the hash/blur numbers
    // for every photo by roughly the same amount, which defeats the point of
    // comparing them (duplicate detection needs the hash to reflect the
    // photo the seller actually took, not Flikax's own processing of it).
    [phash, blurScore] = await Promise.all([
      computeAverageHash(inputBuffer),
      computeBlurScore(inputBuffer),
    ]);
  } catch (err) {
    // Logged server-side rather than surfaced to the client: this catch also
    // covers a missing/misconfigured watermark asset (a deploy/config
    // problem), which looks identical to "this photo is corrupt" from the
    // client's perspective but needs to be diagnosable in server logs.
    console.error("Image processing failed:", err);
    return NextResponse.json({ error: "Could not process image" }, { status: 400 });
  }

  // Namespaced under the uploader's user id so Storage RLS policies can scope
  // access by folder prefix, and randomUUID'd so two photos never collide
  // even within the same rapid batch upload.
  const path = `${user.id}/${randomUUID()}.webp`;
  const { error: uploadError } = await storageClient.storage
    .from("listing-images")
    // cacheControl: a random-UUID path with upsert:false is never
    // overwritten, so this file is immutable for its whole lifetime --
    // Supabase's default (3600s = 1 hour) was making viewers re-download
    // full-size photos on every repeat visit. 31536000s = 1 year.
    .upload(path, watermarked, { contentType: "image/webp", upsert: false, cacheControl: "31536000" });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = storageClient.storage.from("listing-images").getPublicUrl(path);

  // No DB row is written here — this route only uploads one file. The client
  // (listing-form.tsx handleFiles/uploadOne) collects this payload per image
  // and writes the listing + listing_images rows itself once the seller
  // submits the whole ad, so path/phash/blurScore/width/height all need to
  // travel back to the browser now to be persisted later.
  return NextResponse.json({ path, url: publicUrl, phash, blurScore, width, height });
}
