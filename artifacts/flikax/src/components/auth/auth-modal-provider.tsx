"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { LoginCardBody } from "@/components/auth/login-card-body";
import { RegisterCardBody } from "@/components/auth/register-card-body";

type AuthModalMode = "sign-in" | "register";

type AuthModalContextValue = {
  openAuthModal: (redirectTo?: string, mode?: AuthModalMode) => void;
};

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

// Mounted once near the root in app/layout.tsx; any component calls
// useAuthModal().openAuthModal() to pop sign-in/register over the current
// page instead of navigating to /auth/login. The actual sign-in UI (email,
// phone OTP, OAuth buttons) is unchanged from the standalone pages -- this
// just wraps LoginCardBody/RegisterCardBody in a floating shell.
//
// A plain client-state modal (deliberately NOT built on Next.js parallel +
// intercepting routes -- that combination hits an unresolved Next.js router
// bug, "TypeError: initialTree is not iterable", the moment a link into the
// intercepted segment is clicked; see https://github.com/vercel/next.js/issues/72541
// for the open issue). This achieves the same "floating overlay, no
// full-page redirect" UX without depending on that router internals.
export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [redirectTo, setRedirectTo] = useState("/");
  const [mode, setMode] = useState<AuthModalMode>("sign-in");

  const openAuthModal = useCallback((target?: string, initialMode: AuthModalMode = "sign-in") => {
    setRedirectTo(target && target.startsWith("/") ? target : "/");
    setMode(initialMode);
    setOpen(true);
  }, []);

  // A successful sign-in (or a link inside the modal, e.g. "Forgot
  // password?") navigates via router.push -- closing the modal whenever the
  // route actually changes covers both without each call site needing to
  // remember to close it itself.
  const pathname = usePathname();
  const prevPathname = useRef(pathname);
  useEffect(() => {
    if (pathname !== prevPathname.current) {
      prevPathname.current = pathname;
      setOpen(false);
    }
  }, [pathname]);

  return (
    <AuthModalContext.Provider value={{ openAuthModal }}>
      {children}
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          // Reset back to the compact sign-in view for next time, once the
          // close animation has had a moment to finish -- resetting
          // immediately would flash the sign-in content while the modal is
          // still visibly closing.
          if (!next) setTimeout(() => setMode("sign-in"), 200);
        }}
      >
        <DialogContent
          showCloseButton
          overlayClassName="bg-black/50"
          // Bottom sheet on mobile (Jiji's own mobile popup shape): pinned
          // to the bottom edge, full width, rounded top corners only, and
          // slides up rather than the base Dialog's zoom-in. From sm: up it
          // reverts to the usual centered floating card -- a bottom sheet
          // reads as mobile-native, a centered dialog as desktop-native.
          className="inset-x-0 bottom-0 top-auto max-h-[85vh] w-full max-w-full translate-x-0 translate-y-0 gap-0 overflow-y-auto rounded-t-3xl rounded-b-none border border-b-0 border-neutral-300 bg-white p-5 shadow-2xl duration-300 data-[state=closed]:slide-out-to-bottom data-[state=closed]:zoom-out-100 data-[state=open]:slide-in-from-bottom data-[state=open]:zoom-in-100 sm:inset-x-auto sm:top-[50%] sm:left-[50%] sm:bottom-auto sm:max-h-[calc(100vh-2rem)] sm:max-w-sm sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl sm:border-b sm:p-6 sm:data-[state=closed]:slide-out-to-bottom-0 sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:slide-in-from-bottom-0 sm:data-[state=open]:zoom-in-95"
        >
          <DialogTitle className="sr-only">{mode === "register" ? "Create your Flikax account" : "Sign in to Flikax"}</DialogTitle>
          <div className="flex min-w-0 flex-col gap-3">
            {mode === "register" ? (
              <RegisterCardBody redirectTo={redirectTo} centered />
            ) : (
              <LoginCardBody redirectTo={redirectTo} centered onSwitchToRegister={() => setMode("register")} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error("useAuthModal must be used within AuthModalProvider");
  return ctx;
}
