"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EmailAuthForm } from "@/components/auth/email-auth-form";
import { PhoneAuthForm } from "@/components/auth/phone-auth-form";

type Method = "email" | "phone";

// Tab state lives here (not in the parent card body) purely so the OAuth
// buttons above this component and the "or continue with" divider don't
// need to re-render when switching tabs -- EmailAuthForm/PhoneAuthForm each
// own their own internal step state (OTP entry, etc.) independently.
export function AuthMethodTabs({
  redirectTo,
  defaultEmailMode = "sign-in",
}: {
  redirectTo?: string;
  defaultEmailMode?: "sign-in" | "sign-up";
}) {
  const [method, setMethod] = useState<Method>("email");

  return (
    <div className="flex w-full min-w-0 flex-col gap-2.5">
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-slate-200" />
        <span className="text-xs font-medium tracking-wide text-neutral-400">or continue with</span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <div className="flex min-w-0 rounded-full bg-neutral-100 p-1 text-sm font-bold">
        <Button
          type="button"
          onClick={() => setMethod("email")}
          variant="ghost"
          className={`h-auto min-w-0 !shrink flex-1 rounded-full py-2 transition-all ${
            method === "email"
              ? "bg-white text-slate-950 shadow-sm hover:bg-white hover:text-slate-950"
              : "text-neutral-600 hover:bg-transparent hover:text-neutral-800"
          }`}
        >
          Email
        </Button>
        <Button
          type="button"
          onClick={() => setMethod("phone")}
          variant="ghost"
          className={`h-auto min-w-0 !shrink flex-1 rounded-full py-2 transition-all ${
            method === "phone"
              ? "bg-white text-slate-950 shadow-sm hover:bg-white hover:text-slate-950"
              : "text-neutral-600 hover:bg-transparent hover:text-neutral-800"
          }`}
        >
          Phone
        </Button>
      </div>

      {method === "email" ? (
        <EmailAuthForm redirectTo={redirectTo} defaultMode={defaultEmailMode} />
      ) : (
        <PhoneAuthForm redirectTo={redirectTo} />
      )}
    </div>
  );
}
