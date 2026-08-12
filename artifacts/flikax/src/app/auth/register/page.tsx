import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { RegisterCardBody } from "@/components/auth/register-card-body";

// Same already-logged-in gate as the login page -- see that file's comment.
// `centered` tells RegisterCardBody it's the sole content of a standalone
// page (vs. embedded in AuthModalProvider's floating overlay elsewhere),
// which affects its internal spacing/heading treatment.
export default async function RegisterPage({
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
    <div className="flex min-h-screen min-w-0 items-center justify-center bg-brand p-4 sm:p-8">
      <div className="flex w-full min-w-0 max-w-sm flex-col gap-3 border border-neutral-300 bg-white p-5 shadow-2xl sm:p-6">
        <RegisterCardBody redirectTo={redirectTo} error={error} centered />
      </div>
    </div>
  );
}
