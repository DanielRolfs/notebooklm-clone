import { signOut } from "./actions";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  // The proxy already blocks anonymous users; this reads the email on the server.
  const { data } = await supabase.auth.getClaims();
  const email = data?.claims.email as string | undefined;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold">Your Notebook</h1>
      <p>Signed in as {email}</p>
      <form action={signOut}>
        <button className="rounded-md border border-foreground/20 px-4 py-2 hover:bg-foreground/5">
          Sign out
        </button>
      </form>
    </main>
  );
}
