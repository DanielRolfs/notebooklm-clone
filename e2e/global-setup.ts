import { mkdirSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

type Cookie = { name: string; value: string; options?: { maxAge?: number } };

// Mints a real Supabase session for a throwaway user, so the signed-in screens can be tested
// without Google login. The session is written as browser cookies exactly like the app writes them.
export default async function globalSetup() {
  if (process.env.E2E_PUBLIC_ONLY === "1") return;

  // Env vars that are already set win; .env.local only fills the gaps.
  try {
    process.loadEnvFile(".env.local");
  } catch {
    // no .env.local: rely on the real environment
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !publishableKey || !serviceKey) {
    const missing = [
      !url && "NEXT_PUBLIC_SUPABASE_URL",
      !publishableKey && "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      !serviceKey && "SUPABASE_SERVICE_ROLE_KEY",
    ].filter(Boolean);
    throw new Error(
      `E2E setup: missing ${missing.join(", ")}. Put them in .env.local or the environment, or run only the public checks with: npm run test:e2e:public`,
    );
  }

  const noPersist = { auth: { persistSession: false, autoRefreshToken: false } };
  const admin = createClient(url, serviceKey, noPersist);
  const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.test`;

  const created = await admin.auth.admin.createUser({ email, email_confirm: true });
  if (created.error || !created.data.user) throw new Error(`E2E setup: could not create the test user (${created.error?.message})`);
  const userId = created.data.user.id;
  mkdirSync("e2e/.auth", { recursive: true });
  // Saved first, so teardown can clean up even if a later step fails.
  writeFileSync("e2e/.auth/user.json", JSON.stringify({ id: userId, email }));

  const link = await admin.auth.admin.generateLink({ type: "magiclink", email });
  const tokenHash = link.data?.properties?.hashed_token;
  if (link.error || !tokenHash) throw new Error(`E2E setup: could not generate a login link (${link.error?.message})`);

  const plain = createClient(url, publishableKey, noPersist);
  const verified = await plain.auth.verifyOtp({ token_hash: tokenHash, type: "magiclink" });
  const session = verified.data.session;
  if (verified.error || !session) throw new Error(`E2E setup: could not verify the login link (${verified.error?.message})`);

  // Let the app's own library encode the session, so cookie names, encoding and chunking match.
  const collected = new Map<string, Cookie>();
  const ssr = createServerClient(url, publishableKey, {
    cookies: {
      getAll: () => [],
      setAll: (cookies: Cookie[]) => cookies.forEach((c) => collected.set(c.name, c)),
    },
  });
  await ssr.auth.setSession({ access_token: session.access_token, refresh_token: session.refresh_token });
  for (let i = 0; i < 20 && collected.size === 0; i++) await new Promise((r) => setTimeout(r, 100));
  if (collected.size === 0) throw new Error("E2E setup: the session produced no cookies");

  const base = new URL(process.env.E2E_BASE_URL ?? "http://localhost:3000");
  const now = Math.floor(Date.now() / 1000);
  const cookies = [...collected.values()]
    .filter((c) => c.value !== "") // an empty value would only clear an old chunk
    .map((c) => ({
      name: c.name,
      value: c.value,
      domain: base.hostname,
      path: "/",
      expires: now + (c.options?.maxAge ?? 400 * 24 * 3600),
      httpOnly: false,
      secure: base.protocol === "https:",
      sameSite: "Lax" as const,
    }));
  writeFileSync("e2e/.auth/state.json", JSON.stringify({ cookies, origins: [] }));
}
