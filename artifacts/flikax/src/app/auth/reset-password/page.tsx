import Link from "next/link";
import { ResetPasswordGate } from "@/components/auth/reset-password-gate";
import { FlikaxLogo } from "@/components/flikax-logo";

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 sm:p-8">
      <FlikaxLogo wordmarkColor="text-brand" iconSize="size-10" wordmarkSize="text-3xl" className="mb-8" />
      <ResetPasswordGate />
    </div>
  );
}
