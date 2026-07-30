"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EmailAuthForm } from "@/components/auth/email-auth-form";
import { PhoneAuthForm } from "@/components/auth/phone-auth-form";

type Method = "email" | "phone";

export function AuthMethodTabs({ redirectTo }: { redirectTo?: string }) {
  const [method, setMethod] = useState<Method>("email");

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-slate-200" />
        <span className="text-xs font-medium tracking-wide text-neutral-400">or continue with</span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <div className="flex rounded-full bg-slate-100 p-1 text-sm font-semibold">
        <Button
          type="button"
          onClick={() => setMethod("email")}
          variant="ghost"
          className={`h-auto flex-1 rounded-full py-2 transition-all ${
            method === "email"
              ? "bg-white text-brand shadow-sm hover:bg-white hover:text-brand"
              : "text-neutral-500 hover:bg-transparent hover:text-neutral-700"
          }`}
        >
          Email
        </Button>
        <Button
          type="button"
          onClick={() => setMethod("phone")}
          variant="ghost"
          className={`h-auto flex-1 rounded-full py-2 transition-all ${
            method === "phone"
              ? "bg-white text-brand shadow-sm hover:bg-white hover:text-brand"
              : "text-neutral-500 hover:bg-transparent hover:text-neutral-700"
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
