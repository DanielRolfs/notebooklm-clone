"use client";

import { createClient } from "@/lib/supabase/client";

export function GoogleSignInButton() {
  async function signIn() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <button
      onClick={signIn}
      className="rounded-md border border-foreground/20 px-4 py-2 font-medium hover:bg-foreground/5"
    >
      Sign in with Google
    </button>
  );
}
