import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { LoginCardBody } from "@/components/auth/login-card-body";

// Server-rendered gate: an already-logged-in visitor who lands here (stale
// bookmark, back button, a stray link) is bounced straight to `redirect`
// before any of the sign-in UI renders, rather than showing a login form
// they don't need. All the actual sign-in flow (method tabs, OTP, OAuth)
// lives in LoginCardBody -- this file only owns the redirect gate + the
// flat brand-color page frame (previously a dark-navy-to-blue gradient,
// dropped in favor of a flat bg-brand fill -- see globals.css for the
// current --brand value).
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string }>;
}) {
  const { redirect: redirectParam, error } = await searchParams;
  const redirectTo = redirectParam?.startsWith("/") ? redirectParam : "/";

  const {
    data: { user },
  } = await getUser();

  if (user) {
    redirect(redirectTo);
  }

  return (
    <div className="flex min-h-screen min-w-0 items-center justify-center bg-brand p-4 sm:p-8">
      <div className="flex w-full min-w-0 max-w-sm flex-col gap-3 rounded-3xl border border-neutral-300 bg-white p-5 shadow-2xl sm:p-6">
        <LoginCardBody redirectTo={redirectTo} error={error} />
      </div>
    </div>
  );
}
