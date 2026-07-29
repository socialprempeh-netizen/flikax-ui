import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { FlikaxLogo } from "@/components/flikax-logo";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-[#0B1B33] to-[#124F9E] p-4 sm:p-8">
      <div className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-8 shadow-2xl sm:p-10">
        <FlikaxLogo wordmarkColor="text-brand" iconSize="size-9" wordmarkSize="text-2xl sm:text-3xl" className="mb-6" />
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
