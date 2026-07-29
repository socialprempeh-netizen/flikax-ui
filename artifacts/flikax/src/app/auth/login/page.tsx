import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { LoginCardBody } from "@/components/auth/login-card-body";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string }>;
}) {
  const { redirect: redirectParam, error } = await searchParams;
  const redirectTo = redirectParam?.startsWith("/") ? redirectParam : "/";

  const {
    data: { user },
  } = await getUser();

  if (user) {
    redirect(redirectTo);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-[#0B1B33] to-[#124F9E] p-4 sm:p-8">
      <div className="flex w-full max-w-md flex-col gap-6 rounded-3xl border border-slate-200/80 bg-white p-8 shadow-2xl sm:p-10">
        <LoginCardBody redirectTo={redirectTo} error={error} />
      </div>
    </div>
  );
}
