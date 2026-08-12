"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { CheckCircle2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const CATEGORIES = ["General feedback", "Bug report", "Listing issue", "Feature request", "Other"] as const;

const FIELD_CLASS =
  "h-auto w-full border-slate-300 px-4 py-2.5 text-sm shadow-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/10";

export function FeedbackForm({
  defaultCategory,
  defaultSubject,
  defaultEmail,
  listingId,
}: {
  defaultCategory: (typeof CATEGORIES)[number];
  defaultSubject: string;
  defaultEmail: string;
  listingId?: string;
}) {
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>(defaultCategory);
  const [subject, setSubject] = useState(defaultSubject);
  const [email, setEmail] = useState(defaultEmail);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const bodyLines = [
      `Category: ${category}`,
      listingId ? `Listing ID: ${listingId}` : null,
      `From: ${email}`,
      "",
      message,
    ].filter((line): line is string => line !== null);

    const mailto = `mailto:feedback@flikax.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
      bodyLines.join("\n")
    )}`;

    setSent(true);
    window.location.href = mailto;
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-green-100 text-green-600">
          <CheckCircle2 className="size-7" />
        </span>
        <div>
          <h2 className="text-lg font-bold text-neutral-900">Opening your email app…</h2>
          <p className="mt-1.5 max-w-sm text-sm text-neutral-500">
            We&apos;ve pre-filled a message to feedback@flikax.com with everything you wrote. Just hit send from
            there to reach us.
          </p>
        </div>
        <Button asChild variant="outline" className="mt-2 ">
          <Link href="/">Back to browsing</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-neutral-700">Category</span>
        <div className="relative">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as (typeof CATEGORIES)[number])}
            className={`${FIELD_CLASS} border appearance-none bg-white pr-9`}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
        </div>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-neutral-700">Subject</span>
        <Input
          type="text"
          required
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className={FIELD_CLASS}
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-neutral-700">Your email</span>
        <Input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className={FIELD_CLASS}
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-neutral-700">Message</span>
        <textarea
          required
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us what's going on..."
          className={`${FIELD_CLASS} resize-none border py-3`}
        />
      </label>

      <Button
        type="submit"
        className="w-full bg-brand-dark py-3 font-semibold text-white shadow-lg shadow-brand/25 transition-all hover:brightness-110"
      >
        Send Feedback
      </Button>
    </form>
  );
}
