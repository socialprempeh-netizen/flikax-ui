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
        <FlikaxLogo wordmarkColor="text-brand" iconSize="size-7" wordmarkSize="text-lg sm:text-xl" />
        <h1 className="mt-2 text-lg font-bold text-neutral-900">Welcome back</h1>
        <p className="mt-0.5 text-xs text-neutral-500 sm:text-sm">Buy and sell anything, anywhere in Ghana.</p>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="flex min-w-0 flex-col items-center gap-2.5">
        <GoogleSignInButton redirectTo={redirectTo} />
        <AuthMethodTabs redirectTo={redirectTo} />
      </div>
    </>
  );
}
