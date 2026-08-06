"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRegions } from "@/lib/use-regions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const FIELD_CLASS = "h-auto w-full rounded-lg border-neutral-200 px-3 py-2 text-sm focus-visible:border-brand";
const SELECT_CLASS = "w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-800 outline-none focus:border-brand";

type Profile = {
  full_name: string | null;
  location: string | null;
  date_of_birth: string | null;
  sex: string | null;
  bio: string | null;
};

// Same 500-char cap as the DB column's check constraint -- enforced here
// too so a seller finds out before submitting, not from a failed update.
const BIO_MAX_LENGTH = 500;

export function PersonalDetailsForm({ profile }: { profile: Profile }) {
  const [supabase] = useState(() => createClient());
  const regions = useRegions();
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [location, setLocation] = useState(profile.location ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(profile.date_of_birth ?? "");
  const [sex, setSex] = useState(profile.sex ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim() || null,
        location: location || null,
        date_of_birth: dateOfBirth || null,
        sex: sex || null,
        bio: bio.trim() || null,
      })
      .eq("id", user.id);

    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setSaved(true);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl bg-white p-5 shadow-md"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-neutral-800">Personal details</h2>
        {saved && (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
            Saved
          </span>
        )}
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-neutral-700">Name</span>
        <Input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className={FIELD_CLASS}
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-neutral-700">Location</span>
        <select
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className={SELECT_CLASS}
        >
          <option value="">Select location</option>
          {regions.map((region) => (
            <optgroup key={region.slug} label={region.name}>
              {region.districts.map((district) => (
                <option key={district.slug} value={district.name}>
                  {district.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-neutral-700">Birthday</span>
          <Input
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            className={FIELD_CLASS}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-neutral-700">Sex</span>
          <select
            value={sex}
            onChange={(e) => setSex(e.target.value)}
            className={SELECT_CLASS}
          >
            <option value="" disabled>
              Select
            </option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="prefer_not_to_say">Prefer not to say</option>
          </select>
        </label>
      </div>

      <label className="block">
        <span className="mb-1 flex items-center justify-between text-sm font-medium text-neutral-700">
          Bio
          <span className="text-xs font-normal text-neutral-400">
            {bio.length}/{BIO_MAX_LENGTH}
          </span>
        </span>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX_LENGTH))}
          placeholder="A short line about what you sell, e.g. 'Trusted phone dealer in Accra since 2019.'"
          rows={3}
          className="w-full resize-none rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-brand"
        />
        <span className="mt-1 block text-xs text-neutral-400">
          Shown on your public seller page, visible to anyone who views your ads.
        </span>
      </label>

      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}

      <Button type="submit" disabled={saving}>
        {saving ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}
