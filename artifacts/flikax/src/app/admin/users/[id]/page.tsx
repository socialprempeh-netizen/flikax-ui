import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { accountStatus } from "@/lib/admin/users";
import { ADMIN_STATUS_LABELS, ADMIN_STATUS_STYLES } from "@/lib/admin/listings";
import { UserDetailActions } from "@/components/admin/user-detail-actions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const currency = new Intl.NumberFormat("en-GH", {
  style: "currency",
  currency: "GHS",
  maximumFractionDigits: 0,
});

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  suspended: "bg-amber-100 text-amber-700",
  banned: "bg-red-100 text-red-700",
};

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const adminClient = createAdminClient();
  if (!adminClient) {
    return <p className="text-sm text-red-600">Admin operations aren&apos;t configured on this environment.</p>;
  }

  const [{ data: profile }, { data: authUserData }, { data: listings }, { data: purchases }, { data: warnings }] =
    await Promise.all([
      adminClient.from("profiles").select("*").eq("id", id).maybeSingle(),
      adminClient.auth.admin.getUserById(id),
      adminClient
        .from("listings")
        .select("id, title, price, status, created_at")
        .eq("user_id", id)
        .order("created_at", { ascending: false }),
      adminClient
        .from("purchases")
        .select("id, status, created_at, premium_plans(name)")
        .eq("user_id", id)
        .order("created_at", { ascending: false }),
      adminClient
        .from("admin_user_warnings")
        .select("id, message, created_at, admin:profiles!admin_user_warnings_admin_id_fkey(full_name)")
        .eq("user_id", id)
        .order("created_at", { ascending: false }),
    ]);

  if (!profile) notFound();

  const authUser = authUserData?.user;
  const status = accountStatus({
    suspendedUntil: profile.suspended_until,
    bannedUntil: authUser?.banned_until ?? null,
  });

  return (
    <div>
      <Link
        href="/admin/users"
        className="mb-4 flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-brand"
      >
        <ChevronLeft className="size-4" />
        Back to users
      </Link>

      <div className="grid gap-6 sm:grid-cols-3">
        <div className="flex flex-col gap-4 sm:col-span-2">
          <Card className="gap-2 rounded-2xl p-5 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-slate-800">{profile.full_name || "Unnamed user"}</h1>
              <Badge className={STATUS_STYLES[status]}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>
              {profile.role && (
                <Badge className="bg-slate-100 text-slate-600">
                  {profile.role === "super_admin" ? "Super Admin" : "Admin"}
                </Badge>
              )}
              {profile.verified && <Badge className="bg-blue-100 text-blue-700">Verified</Badge>}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-3 text-sm text-slate-600 sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Phone</p>
                <p>{profile.phone || "—"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Email</p>
                <p>{authUser?.email || "—"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Joined</p>
                <p>{new Date(profile.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Last active</p>
                <p>{authUser?.last_sign_in_at ? new Date(authUser.last_sign_in_at).toLocaleDateString() : "Never"}</p>
              </div>
            </div>
          </Card>

          <Card className="gap-2 rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-bold text-slate-800">Listings ({listings?.length ?? 0})</h2>
            {(listings ?? []).length === 0 ? (
              <p className="mt-2 text-sm text-slate-400">No listings yet.</p>
            ) : (
              <div className="mt-1 divide-y divide-slate-100">
                {(listings ?? []).map((listing) => (
                  <div key={listing.id} className="flex items-center justify-between py-2.5">
                    <Link
                      href={`/admin/listings/${listing.id}`}
                      className="truncate text-sm font-medium text-slate-700 hover:text-brand hover:underline"
                    >
                      {listing.title}
                    </Link>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-sm text-slate-500">{currency.format(listing.price)}</span>
                      <Badge className={ADMIN_STATUS_STYLES[listing.status] ?? "bg-slate-100 text-slate-600"}>
                        {ADMIN_STATUS_LABELS[listing.status] ?? listing.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="gap-2 rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-bold text-slate-800">Purchases ({purchases?.length ?? 0})</h2>
            {(purchases ?? []).length === 0 ? (
              <p className="mt-2 text-sm text-slate-400">No purchases yet.</p>
            ) : (
              <div className="mt-1 divide-y divide-slate-100">
                {(purchases ?? []).map((purchase) => (
                  <div key={purchase.id} className="flex items-center justify-between py-2.5">
                    <span className="text-sm font-medium text-slate-700">
                      {purchase.premium_plans?.name ?? "Unknown plan"}
                    </span>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-xs text-slate-400">
                        {new Date(purchase.created_at).toLocaleDateString()}
                      </span>
                      <Badge className="bg-slate-100 text-slate-600">{purchase.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="gap-2 rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-bold text-slate-800">Warning log ({warnings?.length ?? 0})</h2>
            {(warnings ?? []).length === 0 ? (
              <p className="mt-2 text-sm text-slate-400">No warnings logged.</p>
            ) : (
              <div className="mt-1 divide-y divide-slate-100">
                {(warnings ?? []).map((warning) => (
                  <div key={warning.id} className="py-2.5">
                    <p className="text-sm text-slate-700">{warning.message}</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {new Date(warning.created_at).toLocaleDateString()} · {warning.admin?.full_name || "Admin"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="sm:col-span-1">
          <UserDetailActions
            userId={profile.id}
            suspended={status === "suspended"}
            banned={status === "banned"}
            verified={profile.verified}
          />
        </div>
      </div>
    </div>
  );
}
