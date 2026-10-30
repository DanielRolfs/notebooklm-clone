// Small stroke icons, one path string each. Dot icons use round caps on zero-length segments.
const paths = {
  plus: "M12 5v14M5 12h14",
  close: "M6 6l12 12M18 6L6 18",
  chevron: "M6 9l6 6 6-6",
  more: "M12 6h.01M12 12h.01M12 18h.01",
  apps: "M5 5h.01M12 5h.01M19 5h.01M5 12h.01M12 12h.01M19 12h.01M5 19h.01M12 19h.01M19 19h.01",
  doc: "M7 3h7l5 5v13H7zM14 3v5h5",
  note: "M7 4h10a3 3 0 013 3v10a3 3 0 01-3 3H7a3 3 0 01-3-3V7a3 3 0 013-3zM8 9h8M8 12h8M8 15h5",
  trash: "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13",
  pencil: "M4 20l4-1 11-11-3-3L5 16z",
  upload: "M12 16V4M7 9l5-5 5 5M5 20h14",
  link: "M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1",
  clipboard: "M9 4h6v3H9zM6 6h3M15 6h3v15H6V6",
  globe: "M12 3a9 9 0 100 18 9 9 0 000-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18",
  search: "M11 4a7 7 0 100 14 7 7 0 000-14zM20 20l-4-4",
  research: "M10 4a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM19 19l-4.2-4.2M18 2l.8 1.9 1.9.8-1.9.8L18 7.4l-.8-1.9-1.9-.8 1.9-.8z",
  drive: "M9 4h6l6 10-3 5H6l-3-5zM9 4l6 10M15 4L9 14M3 14h18",
  docFile: "M5 4h14v16H5zM9 10h6M9 14h4",
  arrowLeft: "M19 12H5M11 6l-6 6 6 6",
  arrowRight: "M5 12h14M13 6l6 6-6 6",
  arrowUp: "M12 19V5M6 11l6-6 6 6",
  copy: "M9 9h10v11H9zM5 15V4h10",
  thumb: "M7 11v9H4v-9zM7 11l4-7c2 0 2 2 2 3v3h6l-2 9H7",
  tune: "M3 6h9M16 6h5M14 4v4M3 12h4M11 12h10M9 10v4M3 18h11M18 18h3M16 16v4",
  // Lucide "settings" (ISC license), the circle written as a path.
  gear: "M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z",
  share: "M12 15V4M8 8l4-4 4 4M7 11H5v9h14v-9h-2",
  panelLeft: "M7 4h10a3 3 0 013 3v10a3 3 0 01-3 3H7a3 3 0 01-3-3V7a3 3 0 013-3zM8.5 10v4",
  panelRight: "M7 4h10a3 3 0 013 3v10a3 3 0 01-3 3H7a3 3 0 01-3-3V7a3 3 0 013-3zM15.5 10v4",
  // Diagonal inward arrows ("close fullscreen") and small arrows used by the reference.
  shrink: "M14 10l6-6M14 10V5M14 10h5M10 14l-6 6M10 14v5M10 14H5",
  chevronRight: "M9 6l6 6-6 6",
  cornerDownRight: "M5 4v8h13M14 8l4 4-4 4",
  reports: "M4 8v12h12M8 4h8v12H8zM20 2l.7 1.8 1.8.7-1.8.7L20 7l-.7-1.8-1.8-.7 1.8-.7z",
  flashcards: "M9 8h10v13H9zM5 17V3h10",
  pin: "M9 4h6M10 4v6l-3 4h10l-3-4V4M12 14v6",
  play: "M6 5l13 7-13 7z",
  audio: "M5 10v5M9 7v10M13 9v6M18 3l.9 2.1L21 6l-2.1.9L18 9l-.9-2.1L15 6l2.1-.9z",
  slides: "M3 6h18v12H3zM6 9h12v6H6z",
  video: "M7 6h7a3 3 0 013 3v6a3 3 0 01-3 3H7a3 3 0 01-3-3V9a3 3 0 013-3zM20 10v4",
  mindmap: "M3 10h4v4H3zM11 4h4v4h-4zM11 16h4v4h-4zM7 12h2V6h2M9 12v6h2M15 6h2M15 18h2",
  quiz: "M8 3h12v12H8zM4 7v13h13M14 6a2 2 0 11.9 3.5c-.9.6-.9 1.2-.9 1.7M14 13h.01",
  chart: "M5 20v-7M10 20V6M15 20v-9M20 20v-5",
  table: "M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01",
  sort: "M4 7h16M4 12h10M4 17h5",
  undo: "M9 8L5 12l4 4M5 12h9a5 5 0 010 10h-2",
  redo: "M15 8l4 4-4 4M19 12h-9a5 5 0 000 10h2",
  bold: "M7 5h6a3.5 3.5 0 010 7H7zM7 12h7a3.5 3.5 0 010 7H7z",
  italic: "M10 5h8M6 19h8M14 5l-4 14",
  code: "M9 7l-5 5 5 5M15 7l5 5-5 5",
  codeBlock: "M4 5h16v14H4zM10 9l-3 3 3 3M14 9l3 3-3 3",
  bulletList: "M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01",
  numberList: "M10 6h10M10 12h10M10 18h10M4 5l1.5-1v4M4 14h3l-3 4h3",
  quote: "M5 17c0-4 1-6 4-7M13 17c0-4 1-6 4-7M4 17h5v-4M12 17h5v-4",
  rule: "M5 12h14",
  clearFormat: "M5 5h14M12 5l-2 14M8 19h8M4 20L20 4",
} as const;

export type IconName = keyof typeof paths;

export function Icon({ name, className = "size-5" }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={name === "more" || name === "apps" ? 2.8 : name === "tune" || name === "chart" ? 2.2 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      <path d={paths[name]} />
    </svg>
  );
}
