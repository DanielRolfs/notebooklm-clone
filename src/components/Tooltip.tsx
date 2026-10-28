// Pure CSS hover tooltip (no state, no handlers, so it also works inside server components).
export function Tooltip({
  text,
  children,
  align = "center",
  block = false,
}: {
  text: string;
  children: React.ReactNode;
  align?: "center" | "right";
  block?: boolean;
}) {
  return (
    <span className={`group relative ${block ? "flex w-full min-w-0" : "inline-flex"}`}>
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute top-full z-50 mt-1 hidden w-max max-w-64 rounded bg-foreground px-2 py-1 text-xs text-background group-hover:block ${
          align === "right" ? "right-0" : "left-1/2 -translate-x-1/2"
        }`}
      >
        {text}
      </span>
    </span>
  );
}

// Grayed-out stand-in for every NotebookLM control that is not part of this clone.
export function OutOfScope({
  children,
  className = "",
  align,
  block,
  label,
}: {
  children: React.ReactNode;
  className?: string;
  align?: "center" | "right";
  block?: boolean;
  label?: string; // accessible name for icon-only controls
}) {
  return (
    <Tooltip text="Not part of this clone's scope" align={align} block={block}>
      <button
        type="button"
        aria-disabled="true"
        aria-label={label}
        className={`inline-flex cursor-not-allowed items-center gap-2 rounded-full px-3 py-1.5 text-foreground/35 ${className}`}
      >
        {children}
      </button>
    </Tooltip>
  );
}
