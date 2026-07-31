"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ChangeEmailForm({ currentEmail }: { currentEmail: string | null }) {
  const [supabase] = useState(() => createClient());
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.updateUser({ email });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-md">
      <h2 className="text-sm font-bold text-neutral-800">Change email</h2>
      <p className="mt-1 text-sm text-neutral-500">Current: {currentEmail ?? "Not set"}</p>

      {sent && (
        <p className="mt-2 text-sm text-green-700">Check your new inbox to confirm the change.</p>
      )}

      <form onSubmit={handleSubmit} className="mt-3 flex flex-wrap items-center gap-2">
        <Input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="h-auto w-auto rounded-lg border-neutral-200 px-3 py-2 text-sm focus-visible:border-brand"
        />
        <Button type="submit" disabled={loading}>
          {loading ? "Sending..." : "Update email"}
        </Button>
      </form>

      {error && <p className="mt-2 text-sm text-red-600" role="alert">{error}</p>}
    </div>
  );
}
