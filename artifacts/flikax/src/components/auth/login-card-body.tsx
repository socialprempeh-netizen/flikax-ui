import { FlikaxLogo } from "@/components/flikax-logo";
import { GoogleSignInButton } from "@/components/auth/google-signin-button";
import { AuthMethodTabs } from "@/components/auth/auth-method-tabs";

export function LoginCardBody({
  redirectTo,
  error,
  centered = false,
}: {
  redirectTo: string;
  error?: string;
  centered?: boolean;
}) {
  return (
    <>
      <div className={centered ? "flex flex-col items-center text-center" : undefined}>
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
    </>
  );
}
