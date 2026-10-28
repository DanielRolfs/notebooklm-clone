import { signOut } from "./actions";
import { createClient } from "@/lib/supabase/server";
import { OutOfScope } from "@/components/Tooltip";
import { Workspace } from "@/components/Workspace";

export default async function HomePage() {
  const supabase = await createClient();
  // The proxy already blocks anonymous users; this reads the email on the server.
  const { data } = await supabase.auth.getClaims();
  const email = data?.claims.email as string | undefined;

  // RLS limits every query to the user's own Notebook (exactly one, created at signup).
  const { data: notebook } = await supabase.from("notebooks").select("id").single();
  const [{ data: sources }, { data: notes }] = await Promise.all([
    supabase.from("sources").select("id, title, type, status").order("created_at"),
    supabase.from("notes").select("id, title, content").order("created_at"),
  ]);

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b border-foreground/10 px-4 py-2">
        <h1 className="font-semibold">Your Notebook</h1>
        <div className="flex items-center gap-2">
          <OutOfScope>Share</OutOfScope>
          <OutOfScope>Settings</OutOfScope>
          <span className="ml-2 text-sm text-foreground/70">{email}</span>
          <form action={signOut}>
            <button className="rounded-md border border-foreground/20 px-3 py-1.5 text-sm hover:bg-foreground/5">
              Sign out
            </button>
          </form>
        </div>
      </header>
      {notebook ? (
        <Workspace notebookId={notebook.id} sources={sources ?? []} notes={notes ?? []} />
      ) : (
        <p className="p-6 text-sm">Your Notebook was not found. Try signing out and in again.</p>
      )}
    </div>
  );
}
