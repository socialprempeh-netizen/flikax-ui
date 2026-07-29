"use client";

import { useState, useTransition, type FormEvent } from "react";
import { grantAdminAccessAction } from "@/app/admin/admins/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function GrantAdminForm() {
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"admin" | "super_admin">("admin");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      try {
        await grantAdminAccessAction(phone, role);
        setPhone("");
        setSuccess(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to grant access.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 flex flex-wrap items-end gap-3">
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-600">Phone number</span>
        <Input
          type="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="024 123 4567"
          className="w-44"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-600">Role</span>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as "admin" | "super_admin")}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-800 outline-none focus:border-brand"
        >
          <option value="admin">Admin</option>
          <option value="super_admin">Super Admin</option>
        </select>
      </label>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Granting..." : "Grant access"}
      </Button>

      {error && <p className="w-full text-sm text-red-600">{error}</p>}
      {success && <p className="w-full text-sm text-green-600">Access granted.</p>}
    </form>
  );
}
