"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const FIELD_CLASS =
  "h-11 w-full rounded-xl border-slate-300 px-4 pl-10 text-sm shadow-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/10";

type Mode = "sign-in" | "sign-up";

export function EmailAuthForm({ redirectTo = "/" }: { redirectTo?: string }) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setCheckEmail(false);
  }

  async function handleSignIn(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push(redirectTo);
  }

  async function handleSignUp(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError("Enter your name.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName.trim() } },
    });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    if (data.session) {
      router.push(redirectTo);
      return;
    }

    // No session back means the project requires email confirmation before
    // the account can log in — the request still succeeded either way.
    setCheckEmail(true);
  }

  if (checkEmail) {
    return (
      <div className="w-full min-w-0">
        <h1 className="text-lg font-bold text-neutral-800">Check your email</h1>
        <p className="mt-1 text-sm text-neutral-500">
          We sent a confirmation link to <span className="font-medium text-neutral-700">{email}</span>. Click
          it to activate your account, then come back and sign in.
        </p>
        <Button
          type="button"
          onClick={() => switchMode("sign-in")}
          variant="outline"
          className="mt-4 h-11 w-full rounded-xl"
        >
          Back to sign in
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0">
      <div className="mb-3 flex min-w-0 rounded-full bg-slate-100 p-1 text-sm font-bold">
        <Button
          type="button"
          onClick={() => switchMode("sign-in")}
          variant="ghost"
          className={`h-auto min-w-0 !shrink flex-1 rounded-full py-2 transition-all ${
            mode === "sign-in"
              ? "bg-white text-neutral-900 shadow-sm hover:bg-white"
              : "text-neutral-500 hover:bg-transparent"
          }`}
        >
          Sign in
        </Button>
        <Button
          type="button"
          onClick={() => switchMode("sign-up")}
          variant="ghost"
          className={`h-auto min-w-0 !shrink flex-1 rounded-full py-2 transition-all ${
            mode === "sign-up"
              ? "bg-white text-neutral-900 shadow-sm hover:bg-white"
              : "text-neutral-500 hover:bg-transparent"
          }`}
        >
          Sign up
        </Button>
      </div>

      <form onSubmit={mode === "sign-in" ? handleSignIn : handleSignUp} className="space-y-3">
        {mode === "sign-up" && (
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-neutral-700">Full name</span>
            <div className="relative">
              <User className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
              <Input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Ama Owusu"
                className={FIELD_CLASS}
              />
            </div>
          </label>
        )}

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-neutral-700">Email</span>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
            <Input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={FIELD_CLASS}
            />
          </div>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-neutral-700">Password</span>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
            <Input
              type="password"
              autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
              required
              minLength={mode === "sign-up" ? 8 : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={FIELD_CLASS}
            />
          </div>
        </label>

        {mode === "sign-up" && (
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-neutral-700">Confirm password</span>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
              <Input
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={FIELD_CLASS}
              />
            </div>
          </label>
        )}

        {mode === "sign-in" && (
          <Link href="/auth/forgot-password" className="block text-right text-sm font-medium text-brand hover:underline">
            Forgot password?
          </Link>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button
          type="submit"
          disabled={loading}
          className="h-11 w-full rounded-xl bg-brand font-semibold text-white shadow-lg shadow-brand/25 transition-all hover:bg-brand-dark"
        >
          {loading ? "Please wait..." : mode === "sign-in" ? "Sign in" : "Create account"}
        </Button>
      </form>
    </div>
  );
}
