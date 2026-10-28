import { existsSync, readFileSync, rmSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// Deletes the throwaway user made by global-setup (foreign keys cascade to Notebook, Sources, Chunks, Notes).
// It only ever deletes the one id saved by setup, and only when its email is an e2e test address.
export default async function globalTeardown() {
  if (process.env.E2E_PUBLIC_ONLY === "1") return;
  const file = "e2e/.auth/user.json";
  if (!existsSync(file)) return;

  try {
    process.loadEnvFile(".env.local");
  } catch {
    // no .env.local
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error("E2E teardown: Supabase env is missing, the test user was NOT deleted. See e2e/.auth/user.json.");
    return;
  }

  const { id, email } = JSON.parse(readFileSync(file, "utf8")) as { id?: string; email?: string };
  if (!id || !email || !/^e2e-[\w-]+@example\.test$/.test(email)) {
    console.error("E2E teardown: refusing to delete, e2e/.auth/user.json does not describe an e2e test user.");
    return;
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const found = await admin.auth.admin.getUserById(id);
  if (found.data.user && found.data.user.email !== email) {
    console.error("E2E teardown: refusing to delete, the user's email does not match the saved test email.");
    return;
  }
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) console.error(`E2E teardown: could not delete the test user ${email} (${error.message})`);
  else rmSync(file);
}
