"use client";

import { useState } from "react";
import Link from "next/link";
import { FlikaxLogo } from "@/components/flikax-logo";
import { GoogleSignInButton } from "@/components/auth/google-signin-button";
import { FacebookSignInButton } from "@/components/auth/facebook-signin-button";
import { EmailOrPhoneSignInForm } from "@/components/auth/email-or-phone-signin-form";
import { Button } from "@/components/ui/button";

// Jiji's exact two-step sign-in shape: Google/Facebook plus one primary
// "Email or phone" button up front, which then swaps in a single combined
// identifier + password form (with Google/Facebook repeated below it as a
// quick way back out). Account creation and phone-OTP verification live on
// their own /auth/register page (see RegisterCardBody) -- deliberately not
// crammed into this card, matching Jiji's own "Registration" link-out.
export function LoginCardBody({
  redirectTo,
  error,
  centered = false,
}: {
  redirectTo: string;
  error?: string;
  centered?: boolean;
}) {
  const [view, setView] = useState<"options" | "form">("options");

  const registrationLink = (
    <p className="text-sm text-neutral-600">
      Don&apos;t have an account?{" "}
      <Link href="/auth/register" className="font-semibold text-brand hover:underline">
        Registration
      </Link>
    </p>
  );

  return (
    <>
      <div className={centered ? "flex flex-col items-center text-center" : undefined}>
        <FlikaxLogo wordmarkColor="text-brand" iconSize="size-7" wordmarkSize="text-lg sm:text-xl" />
        <h1 className="mt-2 text-lg font-bold text-slate-950">
          {view === "options" ? "Sign in" : "Sign in via email or phone"}
        </h1>
        {view === "options" && (
          <p className="mt-0.5 text-xs text-neutral-600 sm:text-sm">Buy and sell anything, anywhere in Ghana.</p>
        )}
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {view === "options" ? (
        <div className="flex w-full min-w-0 flex-col items-center gap-2.5">
          <div className="flex w-full min-w-0 gap-2">
            <GoogleSignInButton redirectTo={redirectTo} compact />
            <FacebookSignInButton redirectTo={redirectTo} compact />
          </div>
          <Button
            type="button"
            onClick={() => setView("form")}
            className="h-11 w-full rounded-xl bg-brand font-semibold text-white shadow-lg shadow-brand/25 transition-all hover:bg-brand-dark"
          >
            Email or phone
          </Button>
          {registrationLink}
        </div>
      ) : (
        <div className="flex w-full min-w-0 flex-col items-center gap-3">
          <EmailOrPhoneSignInForm redirectTo={redirectTo} />
          {registrationLink}
          <div className="flex w-full min-w-0 gap-2">
            <GoogleSignInButton redirectTo={redirectTo} compact />
            <FacebookSignInButton redirectTo={redirectTo} compact />
          </div>
        </div>
      )}
    </>
  );
}
