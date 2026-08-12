"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toGhanaE164 } from "@/lib/phone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const FIELD_CLASS =
  "h-11 w-full border-slate-300 px-4 text-sm shadow-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/10";

// One combined field standing in for either an email or a Ghana phone number
// -- Jiji's exact sign-in shape, rather than our old separate Email/Phone
// tabs. Which Supabase call fires depends entirely on what the identifier
// parses as: an "@" routes to signInWithPassword({ email }), anything else
// gets tried as a Ghana number via toGhanaE164 and goes through
// signInWithPassword({ phone }).
export function EmailOrPhoneSignInForm({ redirectTo = "/" }: { redirectTo?: string }) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmed = identifier.trim();
    const isEmail = trimmed.includes("@");
    const e164 = isEmail ? null : toGhanaE164(trimmed);

    if (!isEmail && !e164) {
      setError("Enter a valid email address or Ghana phone number.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(
      isEmail ? { email: trimmed, password } : { phone: e164!, password }
    );
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push(redirectTo);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full min-w-0 space-y-3">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-neutral-700">Email or Phone</span>
        <Input
          type="text"
          autoComplete="username"
          autoFocus
          required
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="you@example.com or 024 123 4567"
          className={FIELD_CLASS}
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-neutral-700">Password</span>
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`${FIELD_CLASS} pr-10`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-0 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center text-neutral-400 hover:text-neutral-600"
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </label>

      <Link href="/auth/forgot-password" className="block text-right text-sm font-medium text-brand-dark hover:underline">
        Forgot your password?
      </Link>

      {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

      <Button
        type="submit"
        disabled={loading}
        className="h-11 w-full bg-brand-dark font-semibold text-white shadow-lg shadow-brand/25 transition-all hover:brightness-110"
      >
        {loading ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
