import { FlikaxLogo } from "@/components/flikax-logo";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { GoogleSignInButton } from "@/components/auth/google-signin-button";
import { AuthMethodTabs } from "@/components/auth/auth-method-tabs";

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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-[#0B1B33] to-[#124F9E] p-4 sm:p-8">
      <div className="flex w-full max-w-md flex-col gap-6 rounded-3xl border border-slate-200/80 bg-white p-8 shadow-2xl sm:p-10">
        <div>
          <FlikaxLogo wordmarkColor="text-brand" iconSize="size-9" wordmarkSize="text-2xl sm:text-3xl" />
          <h1 className="mt-5 text-2xl font-bold text-neutral-900">Welcome back</h1>
          <p className="mt-1.5 text-sm text-neutral-500">
            Buy and sell anything, anywhere in Ghana. Log in or create an account to get started.
          </p>
        </div>

        {error && (
          <p className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <div className="flex flex-col items-center gap-5">
          <GoogleSignInButton redirectTo={redirectTo} />
          <AuthMethodTabs redirectTo={redirectTo} />
        </div>
      </div>
    </div>
  );
}
