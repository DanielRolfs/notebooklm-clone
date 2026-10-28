import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/Header";
import { Workspace } from "@/components/Workspace";

export default async function HomePage() {
  const supabase = await createClient();
  // The proxy already blocks anonymous users; this reads the email on the server.
  const { data } = await supabase.auth.getClaims();
  const email = data?.claims.email as string | undefined;

  // RLS limits every query to the user's own Notebook (exactly one, created at signup).
  const { data: notebook } = await supabase.from("notebooks").select("id, guide").single();
  const [{ data: sources }, { data: notes }] = await Promise.all([
    supabase.from("sources").select("id, title, type, status").order("created_at"),
    supabase.from("notes").select("id, title, content").order("created_at"),
  ]);

  return (
    <div className="flex h-screen flex-col bg-page">
      <Header email={email} title={notebook?.guide?.title} />
      {notebook ? (
        <Workspace notebookId={notebook.id} sources={sources ?? []} notes={notes ?? []} guide={notebook.guide} />
      ) : (
        <p className="p-6 text-sm">Your Notebook was not found. Try signing out and in again.</p>
      )}
    </div>
  );
}
