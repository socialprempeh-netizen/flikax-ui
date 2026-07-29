"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { LoginCardBody } from "@/components/auth/login-card-body";

type AuthModalContextValue = {
  openAuthModal: (redirectTo?: string) => void;
};

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

// A plain client-state modal (deliberately NOT built on Next.js parallel +
// intercepting routes -- that combination hits an unresolved Next.js router
// bug, "TypeError: initialTree is not iterable", the moment a link into the
// intercepted segment is clicked; see https://github.com/vercel/next.js/issues/72541
// for the open issue). This achieves the same "floating overlay, no
// full-page redirect" UX without depending on that router internals.
export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [redirectTo, setRedirectTo] = useState("/");

  const openAuthModal = useCallback((target?: string) => {
    setRedirectTo(target && target.startsWith("/") ? target : "/");
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
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton
          className="max-w-md gap-0 rounded-3xl border border-slate-200/80 bg-white p-8 shadow-2xl sm:p-10"
        >
          <DialogTitle className="sr-only">Sign in to Flikax</DialogTitle>
          <LoginCardBody redirectTo={redirectTo} centered />
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
