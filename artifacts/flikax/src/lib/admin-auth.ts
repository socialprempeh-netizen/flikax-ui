import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";

// Auth/role gate for every /admin page and admin server action. Looks up the
// signed-in user's `profiles.role` and redirects non-admins away — this is
// the app-level check, not a substitute for RLS (the DB itself must still
// restrict admin-only tables; this just controls who gets to see the UI).

export type AdminRole = "super_admin" | "admin";

const ADMIN_ROLES: readonly AdminRole[] = ["super_admin", "admin"];

export type AdminProfile = {
  id: string;
  role: AdminRole;
  full_name: string | null;
};

/** Any admin role (admin or super_admin). Bounces non-admins to home with no "access denied" tell. */
export async function requireAdmin(): Promise<AdminProfile> {
  const {
    data: { user },
  } = await getUser();
  if (!user) redirect("/");

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.role || !ADMIN_ROLES.includes(profile.role as AdminRole)) {
    redirect("/");
  }

  return { id: user.id, role: profile.role as AdminRole, full_name: profile.full_name };
}

/**
 * Super-admin-only pages (admin management, system settings). An admin who
 * isn't a super_admin is a legitimate admin, just not for this page, so they
 * land back on the admin dashboard rather than all the way out to "/".
 */
export async function requireSuperAdmin(): Promise<AdminProfile> {
  const admin = await requireAdmin();
  if (admin.role !== "super_admin") {
    redirect("/admin");
  }
  return admin;
}
