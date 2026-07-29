import { ResetPasswordGate } from "@/components/auth/reset-password-gate";
import { FlikaxLogo } from "@/components/flikax-logo";

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-gradient-to-br from-slate-900 via-[#0B1B33] to-[#124F9E] p-4 sm:p-8">
      <FlikaxLogo wordmarkColor="text-white" iconSize="size-10" wordmarkSize="text-3xl" />
      <ResetPasswordGate />
    </div>
  );
}
