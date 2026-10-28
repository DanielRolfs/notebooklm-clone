import { GoogleSignInButton } from "./google-sign-in-button";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-2xl font-semibold">NotebookLM Clone</h1>
      <GoogleSignInButton />
      {error && <p className="text-sm text-red-600">Sign-in failed. Please try again.</p>}
    </main>
  );
}
