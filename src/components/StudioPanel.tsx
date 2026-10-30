"use client";

import { useEffect, useRef } from "react";
import { Icon, type IconName } from "./Icons";
import { OutOfScope } from "./Tooltip";
import type { Note } from "./SourcesPanel";

// Label, icon and icon color of the reference tiles; the faded icons keep their hue.
const tools: [string, IconName, string][] = [
  ["Audio Overview", "audio", "text-blue-600"],
  ["Slide Deck", "slides", "text-pink-600"],
  ["Video Overview", "video", "text-green-600"],
  ["Mind Map", "mindmap", "text-purple-600"],
  ["Reports", "reports", "text-pink-600"],
  ["Flashcards", "flashcards", "text-orange-500"],
  ["Quiz", "quiz", "text-teal-700"],
  ["Infographic", "chart", "text-orange-500"],
  ["Data Table", "table", "text-blue-600"],
];

// Folds the right column in; hidden on small screens where the columns are stacked.
function CollapseButton({ onClick, icon = "panelRight" }: { onClick: () => void; icon?: IconName }) {
  return (
    <button onClick={onClick} aria-label="Collapse panel" className="hidden rounded-full p-1 text-foreground/60 hover:bg-foreground/10 lg:block">
      <Icon name={icon} className="size-4" />
    </button>
  );
}

export function StudioPanel({ onCollapse }: { onCollapse: () => void }) {
  return (
    <section className="flex min-h-0 flex-col rounded-3xl bg-panel p-4">
      <div className="mb-3 flex h-6 items-center justify-between">
        <h2>Studio</h2>
        <CollapseButton onClick={onCollapse} />
      </div>
      <div className="studio-grid">
        {tools.map(([name, icon, color]) => (
          <OutOfScope key={name} block className="@container h-12 w-full min-w-0 !justify-start !gap-3 border border-foreground/10 !px-3 !py-0 text-[13px] whitespace-nowrap">
            <Icon name={icon} className={`size-5 shrink-0 opacity-60 ${color}`} />
            <span className="min-w-0 truncate">{name}</span>
            {name === "Reports" && <span className="ml-auto hidden shrink-0 rounded-full bg-foreground/10 px-2 py-0.5 text-xs @min-[170px]:inline">New!</span>}
          </OutOfScope>
        ))}
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-1 px-4 text-center text-foreground/60">
        <Icon name="pencil" className="mb-2 size-6" />
        <p className="font-medium text-foreground/80">Studio output will be saved here.</p>
        <p>After adding sources, click to add Audio Overview, Study Guide, Mind Map, and more!</p>
      </div>
    </section>
  );
}

// Reference formatting toolbar: visible but inert (rich text is out of scope). "|" is a divider.
const TOOLBAR: (IconName | "|" | "style")[] = [
  "undo", "redo", "|", "style", "|", "bold", "italic", "|",
  "link", "code", "codeBlock", "|", "bulletList", "numberList", "quote", "rule", "clearFormat",
];

function NoteToolbar() {
  return (
    <div className="flex flex-wrap items-center gap-y-1 gap-x-0.5 border-b border-foreground/10 px-1 py-2">
      {TOOLBAR.map((item, i) =>
        item === "|" ? (
          <span key={i} className="mx-2 h-4 w-px bg-foreground/15" />
        ) : item === "style" ? (
          <OutOfScope key={item} label="Text style" className="!gap-1 !rounded !px-2 !py-1 text-[13px]">
            Normal <Icon name="chevron" className="size-3" />
          </OutOfScope>
        ) : (
          <OutOfScope key={item} label={item} className="!rounded !p-1.5">
            <Icon name={item} className="size-4" />
          </OutOfScope>
        ),
      )}
    </div>
  );
}

export function NoteEditor({
  note,
  onChange,
  onSave,
  onRemove,
  onClose,
  onCollapse,
}: {
  note: Note;
  onChange: (fields: Partial<Note>) => void;
  onSave: (fields: Partial<Note>) => void;
  onRemove: () => void;
  onClose: () => void;
  onCollapse: () => void;
}) {
  // Last text that reached the database, so blur and debounce never save the same thing twice.
  const saved = useRef({ title: note.title, content: note.content });

  const flush = () => {
    if (note.title === saved.current.title && note.content === saved.current.content) return;
    saved.current = { title: note.title, content: note.content };
    onSave(saved.current);
  };

  // Debounced save while typing; blur below covers leaving the field quickly.
  useEffect(() => {
    const t = setTimeout(flush, 800);
    return () => clearTimeout(t);
  });

  return (
    <section className="flex min-h-0 flex-col rounded-3xl bg-panel p-4">
      <div className="mb-2 flex h-6 items-center justify-between">
        <p className="flex items-center gap-1">
          <button onClick={onClose} className="rounded px-1 hover:bg-foreground/10">
            Studio
          </button>
          <Icon name="chevronRight" className="size-4 text-foreground/60" /> Note
        </p>
        <CollapseButton onClick={onCollapse} icon="shrink" />
      </div>
      <div className="flex items-center gap-2 border-b border-foreground/10 pb-2">
        <input
          value={note.title}
          onChange={(e) => onChange({ title: e.target.value })}
          onBlur={flush}
          aria-label="Note title"
          placeholder="New Note"
          className="min-w-0 flex-1 bg-transparent text-2xl leading-8 outline-none"
        />
        <button onClick={onRemove} aria-label="Remove note" title="Remove note" className="rounded-full p-1.5 hover:bg-red-500/10">
          <Icon name="trash" className="size-5" />
        </button>
      </div>
      <NoteToolbar />
      <textarea
        value={note.content}
        onChange={(e) => onChange({ content: e.target.value })}
        onBlur={flush}
        aria-label="Note text"
        className="min-h-0 flex-1 resize-none px-1 py-2 text-base outline-none"
      />
    </section>
  );
}
