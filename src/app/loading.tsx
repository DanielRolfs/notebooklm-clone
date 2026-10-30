// Shown while the home page loads the Notebook after sign-in.
export default function Loading() {
  return (
    <main
      role="status"
      className="flex h-screen flex-col items-center justify-center gap-6 bg-page text-xl text-foreground"
    >
      Loading your Notebooks...
      <span className="h-6 w-6 animate-spin rounded-full border-[3px] border-foreground/15 border-t-foreground" />
    </main>
  );
}
