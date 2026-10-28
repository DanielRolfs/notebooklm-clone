import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Starts the Google sign-in right away, so the start page needs no extra login screen.
// A route handler (not a client button) so the PKCE cookie is set on the server before the redirect.
export async function GET(request: NextRequest) {
  const { origin } = new URL(request.url);
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback` },
  });
  if (error || !data.url) return NextResponse.redirect(`${origin}/login?error=auth`);
  return NextResponse.redirect(data.url);
}
