"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ForgotPasswordForm() {
  const [supabase] = useState(() => createClient());
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);

    // Supabase's recovery-link redirect delivers the session as a URL hash
    // fragment (#access_token=...), not a ?code= param — fragments never
    // reach the server, so this must NOT go through the server-side
    // /auth/callback route (that's PKCE-code-flow-only, used by Google
    // OAuth). The browser client's detectSessionInUrl auto-consumes the
    // fragment once it lands on this page directly.
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    setLoading(false);
    // Always show the same confirmation regardless of whether the email
    // exists — avoids leaking which addresses are registered.
    setSent(true);
  }

  if (sent) {
    return (
      <div className="w-full">
        <h1 className="text-lg font-bold text-neutral-800">Check your email</h1>
        <p className="mt-1 text-sm text-neutral-500">
          If an account exists for <span className="font-medium text-neutral-700">{email}</span>, we&apos;ve
          sent a link to reset your password.
        </p>
        <Button asChild variant="outline" className="mt-4 w-full rounded-xl">
          <Link href="/auth/login">Back to login</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      <div>
        <h1 className="text-lg font-bold text-neutral-800">Reset your password</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Enter your email and we&apos;ll send you a link to reset it.
        </p>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-neutral-700">Email</span>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
          <Input
            type="email"
            autoComplete="email"
            autoFocus
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="h-auto w-full rounded-xl border-slate-300 px-4 py-3 pl-10 text-sm shadow-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/10"
          />
        </div>
      </label>

      <Button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-brand py-3 font-semibold text-white shadow-lg shadow-brand/25 transition-all hover:bg-brand-dark"
      >
        {loading ? "Sending..." : "Send reset link"}
      </Button>

      <Link href="/auth/login" className="block text-center text-sm font-medium text-brand hover:underline">
        Back to login
      </Link>
    </form>
  );
}
