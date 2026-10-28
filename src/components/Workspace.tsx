"use client";

import { useState } from "react";
import { ChatPanel } from "./ChatPanel";
import { NotesPanel, type Note } from "./NotesPanel";
import { SourcesPanel, type Source } from "./SourcesPanel";

// Holds the ticked Sources so the Sources column can set them and the Chat column can read them.
export function Workspace({
  notebookId,
  sources,
  notes,
}: {
  notebookId: string;
  sources: Source[];
  notes: Note[];
}) {
  // Store the unticked ids: new ready Sources are then ticked by default without an effect.
  const [unticked, setUnticked] = useState<Set<string>>(new Set());
  const selected = new Set(sources.filter((s) => s.status === "ready" && !unticked.has(s.id)).map((s) => s.id));

  const toggle = (id: string) =>
    setUnticked((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 p-3 lg:grid-cols-[280px_1fr_340px]">
      <SourcesPanel sources={sources} selected={selected} onToggle={toggle} />
      <ChatPanel sourceIds={[...selected]} />
      <NotesPanel notebookId={notebookId} initialNotes={notes} />
    </div>
  );
}
