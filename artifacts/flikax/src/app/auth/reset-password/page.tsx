import { ResetPasswordGate } from "@/components/auth/reset-password-gate";
import { FlikaxLogo } from "@/components/flikax-logo";

// No server-side session check here (unlike login/register) -- the whole
// point of this page is being reachable via a signed-out password-reset
// link, and ResetPasswordGate itself handles detecting/validating the
// recovery token client-side (see its own comments for the hash-fragment
// vs. PKCE distinction).
export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-gradient-to-br from-slate-900 via-[#0B1B33] to-[#124F9E] p-4 sm:p-8">
      <FlikaxLogo wordmarkColor="text-white" iconSize="size-10" wordmarkSize="text-3xl" />
      <ResetPasswordGate />
    </div>
  );
}
