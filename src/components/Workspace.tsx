"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ChatPanel } from "./ChatPanel";
import { SourcesPanel, type Note, type Source } from "./SourcesPanel";
import { NoteEditor, StudioPanel } from "./StudioPanel";

// Holds the ticked Sources (Sources column sets them, Chat reads them) and the Notes
// (listed in the Sources column, edited in the right column).
export function Workspace({
  notebookId,
  sources,
  notes: initialNotes,
}: {
  notebookId: string;
  sources: Source[];
  notes: Note[];
}) {
  const [supabase] = useState(createClient);
  // Store the unticked ids: new ready Sources are then ticked by default without an effect.
  const [unticked, setUnticked] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState(initialNotes);
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const selected = new Set(sources.filter((s) => s.status === "ready" && !unticked.has(s.id)).map((s) => s.id));
  const open = notes.find((n) => n.id === openId);

  const toggle = (id: string) =>
    setUnticked((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  const toggleAll = (checked: boolean) =>
    setUnticked(checked ? new Set() : new Set(sources.map((s) => s.id)));

  const patch = (id: string, fields: Partial<Note>) =>
    setNotes((ns) => ns.map((n) => (n.id === id ? { ...n, ...fields } : n)));

  async function createNote() {
    setError("");
    const { data, error } = await supabase
      .from("notes")
      .insert({ notebook_id: notebookId, title: "New Note" })
      .select("id, title, content")
      .single();
    if (error) return setError(error.message);
    setNotes((ns) => [...ns, data]);
    setOpenId(data.id);
  }

  async function saveNote(id: string, fields: Partial<Note>) {
    const { error } = await supabase
      .from("notes")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", id);
    setError(error ? `Could not save: ${error.message}` : "");
  }

  async function removeNote(id: string) {
    setError("");
    const { error } = await supabase.from("notes").delete().eq("id", id);
    if (error) return setError(error.message);
    setNotes((ns) => ns.filter((n) => n.id !== id));
    if (openId === id) setOpenId(null);
  }

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 px-3 pb-3 lg:grid-cols-[320px_minmax(0,1fr)_360px]">
      <SourcesPanel
        sources={sources}
        selected={selected}
        onToggle={toggle}
        onToggleAll={toggleAll}
        notes={notes}
        openNoteId={openId}
        onCreateNote={createNote}
        onOpenNote={setOpenId}
        onRenameNote={(id, title) => {
          patch(id, { title });
          saveNote(id, { title });
        }}
        onRemoveNote={removeNote}
      />
      <ChatPanel sourceIds={[...selected]} />
      <div className="flex min-h-0 flex-col gap-2 [&>section]:flex-1">
        {error && <p role="alert" className="rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-300">{error}</p>}
        {open ? (
          <NoteEditor
            key={open.id}
            note={open}
            onChange={(fields) => patch(open.id, fields)}
            onSave={(fields) => saveNote(open.id, fields)}
            onRemove={() => removeNote(open.id)}
            onClose={() => setOpenId(null)}
          />
        ) : (
          <StudioPanel />
        )}
      </div>
    </div>
  );
}
