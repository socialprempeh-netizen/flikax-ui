import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// OAuth (Google/Facebook) redirect target -- this is the `redirectTo` both
// google-signin-button.tsx and facebook-signin-button.tsx pass to
// signInWithOAuth(). Supabase's PKCE code flow lands the provider here with
// a one-time `?code=`, which exchangeCodeForSession() below trades for a
// real session, setting the session cookie via createClient()'s Set-Cookie
// before redirecting on to the original destination. Note this route is
// specific to the code-flow (OAuth); password-recovery links use a
// different mechanism entirely -- see reset-password-gate.tsx.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const oauthError = searchParams.get("error_description") || searchParams.get("error");
  const redirectParam = searchParams.get("redirect");
  const redirectTo = redirectParam?.startsWith("/") ? redirectParam : "/";

  // The provider (or Supabase) can redirect back with ?error=... instead of
  // ?code=... — a cancelled consent screen, an expired/reused code, an
  // account-linking conflict, etc. Previously this fell through silently and
  // the user just landed back on the homepage with no explanation.
  if (oauthError) {
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(oauthError)}&redirect=${encodeURIComponent(redirectTo)}`
    );
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        `${origin}/auth/login?error=${encodeURIComponent(error.message)}&redirect=${encodeURIComponent(redirectTo)}`
      );
    }
  }

  return NextResponse.redirect(`${origin}${redirectTo}`);
}
