// Original logo mark: three nested arcs in blue shades with a small dot.
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 22" fill="none" strokeLinecap="round" className={className} aria-hidden>
      <path d="M2 18a14 14 0 0 1 28 0" stroke="#a9c2fb" strokeWidth="3" />
      <path d="M7 18a9 9 0 0 1 18 0" stroke="#6b97f7" strokeWidth="3" />
      <path d="M12 18a4 4 0 0 1 8 0" stroke="#2f6df0" strokeWidth="3" />
      <circle cx="16" cy="19.5" r="1.5" fill="#2f6df0" />
    </svg>
  );
}
