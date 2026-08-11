import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { FlikaxLogo } from "@/components/flikax-logo";

// Thin page shell -- all the actual logic (sending the reset email, the
// hash-fragment/PKCE redirect handling) lives in ForgotPasswordForm. This
// flat brand-teal card wrapper (previously a dark-navy-to-blue gradient) is
// duplicated across login/register/reset-password instead of a shared
// `auth/layout.tsx` since each page's card has slightly different
// width/centering needs; consolidating it is a reasonable future cleanup
// but not done here to avoid touching four pages for a cosmetic win.
export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand p-4 sm:p-8">
      <div className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-8 shadow-2xl sm:p-10">
        <FlikaxLogo wordmarkColor="text-brand" iconSize="size-9" wordmarkSize="text-2xl sm:text-3xl" className="mb-6" />
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
