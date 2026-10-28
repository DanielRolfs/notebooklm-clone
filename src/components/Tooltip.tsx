// Pure CSS hover tooltip (no state, no library).
export function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-50 mt-1 hidden w-max max-w-64 -translate-x-1/2 rounded bg-foreground px-2 py-1 text-xs text-background group-hover:block"
      >
        {text}
      </span>
    </span>
  );
}

// Grayed-out stand-in for every NotebookLM control that is not part of this clone.
export function OutOfScope({ children }: { children: React.ReactNode }) {
  return (
    <Tooltip text="Not part of this clone's scope">
      <button
        type="button"
        aria-disabled="true"
        className="cursor-not-allowed rounded-md border border-foreground/10 px-3 py-1.5 text-sm text-foreground/35"
      >
        {children}
      </button>
    </Tooltip>
  );
}
