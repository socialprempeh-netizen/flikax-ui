"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EmailAuthForm } from "@/components/auth/email-auth-form";
import { PhoneAuthForm } from "@/components/auth/phone-auth-form";

type Method = "email" | "phone";

export function AuthMethodTabs({ redirectTo }: { redirectTo?: string }) {
  const [method, setMethod] = useState<Method>("email");

  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-neutral-200" />
        <span className="text-xs font-medium text-neutral-400">or</span>
        <span className="h-px flex-1 bg-neutral-200" />
      </div>

      <div className="flex justify-center gap-6 text-base font-bold">
        <Button
          type="button"
          onClick={() => setMethod("email")}
          variant="ghost"
          className={`h-auto rounded-none border-b-2 p-0 pb-1 hover:bg-transparent ${
            method === "email" ? "border-brand text-brand hover:text-brand" : "border-transparent text-neutral-400"
          }`}
        >
          Email
        </Button>
        <Button
          type="button"
          onClick={() => setMethod("phone")}
          variant="ghost"
          className={`h-auto rounded-none border-b-2 p-0 pb-1 hover:bg-transparent ${
            method === "phone" ? "border-brand text-brand hover:text-brand" : "border-transparent text-neutral-400"
          }`}
        >
          Phone
        </Button>
      </div>

      {method === "email" ? (
        <EmailAuthForm redirectTo={redirectTo} />
      ) : (
        <PhoneAuthForm redirectTo={redirectTo} />
      )}
    </div>
  );
}
