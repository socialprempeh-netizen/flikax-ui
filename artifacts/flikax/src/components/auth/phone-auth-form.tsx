"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toGhanaE164 } from "@/lib/phone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OtpInput } from "@/components/auth/otp-input";

const OTP_LENGTH = 6;

const FIELD_CLASS =
  "h-11 w-full rounded-xl border-slate-300 px-4 text-sm shadow-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/10";

const RESEND_SECONDS = 30;

type Step = "phone" | "otp" | "name";

// Ghana phone + SMS OTP sign-in/sign-up, combined into one flow (Supabase's
// phone auth treats "new number" and "existing number" identically -- both
// just get an OTP, and signInWithOtp implicitly creates the auth user on
// first verify). Three steps:
//   1. "phone"  -- collect a local Ghana number, normalize to E.164 via
//      toGhanaE164 (Supabase's phone auth requires E.164), call
//      signInWithOtp({ phone }) to trigger the SMS.
//   2. "otp"    -- verifyOtp({ phone, token, type: "sms" }) exchanges the
//      6-digit code for a real session. On success we check whether this
//      user already has a profiles.full_name (returning user) or not
//      (brand-new phone signup, since phone auth alone never collects a
//      name) and branch to step 3 only when it's missing.
//   3. "name"   -- one-time name capture for brand-new phone accounts,
//      written straight to profiles via an authenticated update (RLS scopes
//      it to auth.uid() = id).
export function PhoneAuthForm({ redirectTo = "/" }: { redirectTo?: string }) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const [step, setStep] = useState<Step>("phone");
  const [rawPhone, setRawPhone] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // rawPhone stays whatever the user typed (so the "024 123 4567" input
  // keeps its editable local format if they hit "Change number" later);
  // `phone` only ever holds the validated E.164 form Supabase's SMS API
  // actually requires, and is what verifyOtp/resendOtp reuse afterwards.
  async function sendOtp(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const e164 = toGhanaE164(rawPhone);
    if (!e164) {
      setError("Enter a valid Ghana phone number, e.g. 024 123 4567.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ phone: e164 });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setPhone(e164);
    setStep("otp");
    setCooldown(RESEND_SECONDS);
  }

  // Guarded by the same `cooldown` countdown shown next to the "Resend OTP"
  // button -- purely a client-side UX throttle (Supabase enforces its own
  // rate limit server-side regardless) so users aren't tempted to spam the
  // SMS provider while a code is already in flight.
  async function resendOtp() {
    if (cooldown > 0) return;
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ phone });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }
    setCooldown(RESEND_SECONDS);
  }

  // The step where the SMS code is actually exchanged for a session.
  // verifyOtp() logs the user in (or, for a phone number seen for the first
  // time, creates the auth user) in one call -- there's no separate
  // "confirm this is a new account" step. Afterwards we look up
  // profiles.full_name: a phone-only signup has no name yet (unlike email
  // signup, which collects it up front), so a missing name is how we detect
  // "this was just created" and route to the one-time "name" step instead
  // of straight to redirectTo.
  async function verifyOtp(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token: otp,
      type: "sms",
    });

    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }

    const user = data.user;
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile?.full_name) {
        setLoading(false);
        setStep("name");
        return;
      }
    }

    router.push(redirectTo);
  }

  // Only reached from the "name" step, i.e. only for a phone number that
  // just verified for the first time with no profiles.full_name set yet.
  async function saveName(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError("Enter your name.");
      return;
    }

    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName.trim() })
        .eq("id", user.id);

      if (error) {
        setLoading(false);
        setError(error.message);
        return;
      }
    }

    router.push(redirectTo);
  }

  return (
    <div className="w-full min-w-0">
      {step === "phone" && (
        <form onSubmit={sendOtp} className="space-y-3">
          <div>
            <h1 className="text-lg font-bold text-slate-950">Log in or sign up</h1>
            <p className="mt-1 text-sm text-neutral-500">
              We&apos;ll text you a code to verify your number.
            </p>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-neutral-700">
              Phone number
            </span>
            <div className="flex h-11 min-w-0 items-center rounded-xl border border-slate-300 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/10">
              <span className="flex h-full items-center border-r border-slate-300 px-3.5 text-sm text-neutral-500">
                +233
              </span>
              <Input
                type="tel"
                inputMode="tel"
                autoFocus
                required
                value={rawPhone}
                onChange={(e) => setRawPhone(e.target.value)}
                placeholder="024 123 4567"
                className="h-full min-w-0 flex-1 rounded-l-none border-none px-4 text-sm shadow-none focus-visible:ring-0"
              />
            </div>
          </label>

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded-xl bg-brand-dark font-semibold text-white shadow-lg shadow-brand/25 transition-all hover:brightness-110"
          >
            {loading ? "Sending code..." : "Send code"}
          </Button>
        </form>
      )}

      {step === "otp" && (
        <form
          onSubmit={verifyOtp}
          className="space-y-4 rounded-2xl border border-neutral-300 bg-white p-5 shadow-lg"
        >
          <div>
            <h1 className="text-xl font-bold text-slate-950">OTP Validation</h1>
            <p className="mt-1 text-sm text-neutral-500">
              Enter the 6-digit code sent to {phone}.{" "}
              <Button type="button" onClick={() => setStep("phone")} variant="link" className="h-auto p-0 text-sm">
                Change number
              </Button>
            </p>
          </div>

          <OtpInput value={otp} onChange={setOtp} length={OTP_LENGTH} autoFocus />

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading || otp.length !== OTP_LENGTH}
            className="h-11 w-full rounded-xl bg-brand-dark font-semibold text-white shadow-lg shadow-brand/25 transition-all hover:brightness-110"
          >
            {loading ? "Verifying..." : "Confirm OTP"}
          </Button>

          <div className="flex items-center justify-center gap-1 text-sm">
            {cooldown > 0 ? (
              <span className="text-neutral-500">
                Resend after <span className="font-semibold text-neutral-700">{cooldown}s</span>
              </span>
            ) : (
              <Button
                type="button"
                onClick={resendOtp}
                disabled={loading}
                variant="ghost"
                className="h-auto p-0 text-sm font-semibold text-brand-dark hover:bg-transparent hover:text-brand-dark"
              >
                Resend OTP
              </Button>
            )}
          </div>
        </form>
      )}

      {step === "name" && (
        <form onSubmit={saveName} className="space-y-3">
          <div>
            <h1 className="text-lg font-bold text-slate-950">What&apos;s your name?</h1>
            <p className="mt-1 text-sm text-neutral-500">
              This is how buyers and sellers will see you on Flikax.
            </p>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-neutral-700">Full name</span>
            <div className="relative">
              <User className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
              <Input
                type="text"
                autoFocus
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Ama Owusu"
                className={`${FIELD_CLASS} pl-10`}
              />
            </div>
          </label>

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded-xl bg-brand-dark font-semibold text-white shadow-lg shadow-brand/25 transition-all hover:brightness-110"
          >
            {loading ? "Saving..." : "Continue"}
          </Button>
        </form>
      )}
    </div>
  );
}
