import { FlikaxLogo } from "@/components/flikax-logo";
import { GoogleSignInButton } from "@/components/auth/google-signin-button";
import { FacebookSignInButton } from "@/components/auth/facebook-signin-button";
import { AuthMethodTabs } from "@/components/auth/auth-method-tabs";

// The full account-creation experience (email + password + full name, or
// phone + OTP) -- everything the simplified Jiji-style sign-in card
// deliberately leaves out. Reached via the "Registration" link rather than
// living inline in the sign-in modal.
export function RegisterCardBody({
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
        <FlikaxLogo wordmarkColor="text-brand-dark" iconSize="size-7" wordmarkSize="text-lg sm:text-xl" />
        <h1 className="mt-2 text-lg font-bold text-slate-950">Create your account</h1>
        <p className="mt-0.5 text-13 text-neutral-600 sm:text-sm">Buy and sell anything, anywhere in Ghana.</p>
      </div>

      {error && (
        <p className="bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="flex min-w-0 flex-col items-center gap-2.5">
        <div className="flex w-full min-w-0 gap-2">
          <GoogleSignInButton redirectTo={redirectTo} compact />
          <FacebookSignInButton redirectTo={redirectTo} compact />
        </div>
        <AuthMethodTabs redirectTo={redirectTo} defaultEmailMode="sign-up" />
      </div>
    </>
  );
}
