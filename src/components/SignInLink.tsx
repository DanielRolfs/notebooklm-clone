"use client";

import { useEffect, useState, type ReactNode } from "react";
import { LoadingScreen } from "@/components/LoadingScreen";

// Covers the page with the loading screen as soon as sign-in starts. If Google shows its own
// login, the page is replaced anyway; if the user comes back with the Back button, it is reset.
export function SignInLink({ className, children }: { className?: string; children: ReactNode }) {
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const reset = () => setBusy(false);
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);

  return (
    <>
      {/* Plain link: a route handler, so no client-side navigation. */}
      <a href="/auth/google" className={className} onClick={() => setBusy(true)}>
        {children}
      </a>
      {busy && <LoadingScreen className="fixed inset-0 z-50" />}
    </>
  );
}
