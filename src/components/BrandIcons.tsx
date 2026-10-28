// Small multi-color logos of Google products and YouTube, for the controls that are only shown, not wired up.
const base = { viewBox: "0 0 24 24", "aria-hidden": true as const, className: "size-4 shrink-0" };

export function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg {...base} className={className ?? base.className}>
      <rect x="1.5" y="4.5" width="21" height="15" rx="4.5" fill="#f00" />
      <path d="M10 9l5.5 3-5.5 3z" fill="#fff" />
    </svg>
  );
}

export function PlayBooksIcon({ className }: { className?: string }) {
  return (
    <svg {...base} className={className ?? base.className}>
      <path d="M4 3.5l16 8.5-16 8.5z" fill="#4285f4" />
      <path d="M4 3.5l8.5 8.5L4 20.5z" fill="#1a56c4" />
    </svg>
  );
}

export function DriveIcon({ className }: { className?: string }) {
  return (
    <svg {...base} className={className ?? base.className}>
      <path d="M8 3h8l7 12h-8z" fill="#fbbc04" />
      <path d="M8 3L1 15l4 6 7-12z" fill="#0f9d58" />
      <path d="M5 21l3-6h15l-4 6z" fill="#4285f4" />
    </svg>
  );
}
