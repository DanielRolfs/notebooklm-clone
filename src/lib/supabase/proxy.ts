import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseEnv } from "@/lib/env";

const PUBLIC_PATHS = ["/login", "/auth"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, key } = supabaseEnv();

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        // Stops CDNs from caching responses that carry a refreshed session.
        Object.entries(headers).forEach(([k, v]) => response.headers.set(k, v));
      },
    },
  });

  // getClaims validates the JWT and refreshes the session if it is near expiry.
  const { data } = await supabase.auth.getClaims();
  const isPublic = PUBLIC_PATHS.some((p) => request.nextUrl.pathname.startsWith(p));

  if (!data?.claims && !isPublic) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/login";
    redirect.search = "";
    return NextResponse.redirect(redirect);
  }
  return response;
}
