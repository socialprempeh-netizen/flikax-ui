import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { FlikaxLogo } from "@/components/flikax-logo";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 sm:p-8">
      <FlikaxLogo wordmarkColor="text-brand" iconSize="size-10" wordmarkSize="text-3xl" className="mb-8" />
      <ForgotPasswordForm />
    </div>
  );
}
