"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const FIELD_CLASS = "h-auto w-full rounded-lg border-neutral-200 px-3 py-2 text-sm focus-visible:border-brand";

export function ChangePasswordForm({ redirectTo }: { redirectTo?: string } = {}) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }
    setPassword("");
    setConfirm("");
    setSaved(true);

    if (redirectTo) {
      router.push(redirectTo);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-2xl bg-white p-5 shadow-md"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-neutral-800">Change password</h2>
        {saved && (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
            Saved
          </span>
        )}
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-neutral-700">New password</span>
        <Input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={FIELD_CLASS}
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-neutral-700">Confirm password</span>
        <Input
          type="password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={FIELD_CLASS}
        />
      </label>

      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}

      <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : "Update password"}
      </Button>
    </form>
  );
}
