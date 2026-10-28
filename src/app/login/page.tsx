import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  // Straight to Google, unless the last attempt failed.
  if (!error) redirect("/auth/google");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-2xl font-semibold">NotebookLM Clone</h1>
      <p className="text-sm text-red-600">Sign-in failed. Please try again.</p>
      {/* Plain link: a route handler, so no client-side prefetch or navigation. */}
      <a href="/auth/google" className="rounded-md border border-foreground/20 px-4 py-2 font-medium hover:bg-foreground/5">
        Sign in with Google
      </a>
    </main>
  );
}
