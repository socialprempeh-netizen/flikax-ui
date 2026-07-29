import Link from "next/link";
import { X } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { accountStatus, type AdminUserRow } from "@/lib/admin-users";
import { UsersRowActions } from "@/components/admin/users-row-actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  user: "User",
};

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  suspended: "bg-amber-100 text-amber-700",
  banned: "bg-red-100 text-red-700",
};

type PageProps = {
  searchParams: Promise<{ q?: string; role?: string; status?: string }>;
};

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = params.q?.trim().toLowerCase();
  const roleFilter = params.role;
  const statusFilter = params.status;

  const adminClient = createAdminClient();
  if (!adminClient) {
    return (
      <div>
        <h1 className="text-xl font-bold text-slate-800">Users</h1>
        <p className="mt-4 text-sm text-red-600">
          Admin operations aren&apos;t configured on this environment (missing service role key).
        </p>
      </div>
    );
  }

  const [{ data: profiles }, { data: authData }] = await Promise.all([
    adminClient.from("profiles").select("*").order("created_at", { ascending: false }),
    adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);

  const authUsersById = new Map((authData?.users ?? []).map((u) => [u.id, u]));

  let rows: AdminUserRow[] = (profiles ?? []).map((p) => {
    const authUser = authUsersById.get(p.id);
    return {
      id: p.id,
      fullName: p.full_name,
      phone: p.phone,
      role: p.role,
      createdAt: p.created_at,
      suspendedUntil: p.suspended_until,
      email: authUser?.email ?? null,
      bannedUntil: authUser?.banned_until ?? null,
      lastSignInAt: authUser?.last_sign_in_at ?? null,
    };
  });

  if (q) {
    rows = rows.filter(
      (r) =>
        r.fullName?.toLowerCase().includes(q) ||
        r.phone?.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
    );
  }
  if (roleFilter) {
    rows = rows.filter((r) => (roleFilter === "user" ? !r.role : r.role === roleFilter));
  }
  if (statusFilter) {
    rows = rows.filter((r) => accountStatus(r) === statusFilter);
  }

  const hasFilters = Boolean(q || roleFilter || statusFilter);

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-800">Users</h1>
      <p className="mt-1 text-sm text-slate-500">{rows.length} user{rows.length === 1 ? "" : "s"}.</p>

      <Card className="mt-6 mb-4 gap-0 rounded-2xl p-4 shadow-sm">
        <form method="get" className="flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Search
            </span>
            <Input
              type="text"
              name="q"
              defaultValue={params.q}
              placeholder="Name, phone, email, or ID"
              className="w-64"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Role
            </span>
            <select
              name="role"
              defaultValue={roleFilter ?? ""}
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm text-slate-800 shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <option value="">All</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Status
            </span>
            <select
              name="status"
              defaultValue={statusFilter ?? ""}
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm text-slate-800 shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="banned">Banned</option>
            </select>
          </label>

          <Button type="submit">Apply</Button>

          {hasFilters && (
            <Button asChild variant="ghost" className="text-slate-500 hover:text-brand">
              <Link href="/admin/users">
                <X className="size-3.5" />
                Clear
              </Link>
            </Button>
          )}
        </form>
      </Card>

      <Card className="gap-0 divide-y divide-slate-100 overflow-hidden rounded-2xl p-0 shadow-sm">
        {rows.length === 0 ? (
          <p className="p-6 text-sm text-slate-400">No users match these filters.</p>
        ) : (
          rows.map((row) => {
            const status = accountStatus(row);
            return (
              <div key={row.id} className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/admin/users/${row.id}`}
                      className="text-sm font-bold text-slate-800 hover:text-brand hover:underline"
                    >
                      {row.fullName || "Unnamed user"}
                    </Link>
                    <Badge className={STATUS_STYLES[status]}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Badge>
                    {row.role && (
                      <Badge className="bg-slate-100 text-slate-600">{ROLE_LABELS[row.role] ?? row.role}</Badge>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {[row.phone, row.email].filter(Boolean).join(" · ") || "No contact info"}
                  </p>
                </div>

                <UsersRowActions
                  userId={row.id}
                  suspended={status === "suspended"}
                  banned={status === "banned"}
                />
              </div>
            );
          })
        )}
      </Card>
    </div>
  );
}
