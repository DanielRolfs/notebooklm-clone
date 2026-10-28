// Small stroke icons, one path string each. Dot icons use round caps on zero-length segments.
const paths = {
  plus: "M12 5v14M5 12h14",
  close: "M6 6l12 12M18 6L6 18",
  chevron: "M6 9l6 6 6-6",
  more: "M12 6h.01M12 12h.01M12 18h.01",
  apps: "M5 5h.01M12 5h.01M19 5h.01M5 12h.01M12 12h.01M19 12h.01M5 19h.01M12 19h.01M19 19h.01",
  doc: "M7 3h7l5 5v13H7zM14 3v5h5",
  note: "M5 4h14v16H5zM8 9h8M8 13h8M8 17h5",
  trash: "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13",
  pencil: "M4 20l4-1 11-11-3-3L5 16z",
  upload: "M12 16V4M7 9l5-5 5 5M5 20h14",
  link: "M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1",
  clipboard: "M9 4h6v3H9zM6 6h3M15 6h3v15H6V6",
  globe: "M12 3a9 9 0 100 18 9 9 0 000-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18",
  search: "M11 4a7 7 0 100 14 7 7 0 000-14zM20 20l-4-4",
  arrowRight: "M5 12h14M13 6l6 6-6 6",
  arrowUp: "M12 19V5M6 11l6-6 6 6",
  copy: "M9 9h10v11H9zM5 15V4h10",
  thumb: "M7 11v9H4v-9zM7 11l4-7c2 0 2 2 2 3v3h6l-2 9H7",
  tune: "M4 7h10M18 7h2M4 17h2M10 17h10M16 4v6M8 14v6",
  gear: "M12 15a3 3 0 100-6 3 3 0 000 6zM19 12l2-1-2-4-2 1-2-1-1-2h-4l-1 2-2 1-2-1-2 4 2 1v2l-2 1 2 4 2-1 2 1 1 2h4l1-2 2-1 2 1 2-4-2-1z",
  share: "M12 15V4M8 8l4-4 4 4M5 13v7h14v-7",
  panel: "M4 5h16v14H4zM9 5v14",
  pin: "M9 4h6M10 4v6l-3 4h10l-3-4V4M12 14v6",
  play: "M6 5l13 7-13 7z",
  audio: "M6 10v4M10 6v12M14 8v8M18 11v2",
  slides: "M4 6h16v12H4zM8 21h8",
  video: "M4 6h11v12H4zM15 10l5-3v10l-5-3",
  mindmap: "M5 12h4M9 12l5-5h5M9 12l5 5h5",
  quiz: "M9 9a3 3 0 116 0c0 2-3 2-3 5M12 18h.01",
  chart: "M5 20V10M12 20V4M19 20v-7",
  table: "M4 5h16v14H4zM4 10h16M4 15h16M10 5v14",
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
      strokeWidth={name === "more" || name === "apps" ? 2.8 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      <path d={paths[name]} />
    </svg>
  );
}
