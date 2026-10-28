"use client";

import { useState } from "react";
import { Icon } from "./Icons";
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
  const [collapsed, setCollapsed] = useState(false);
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

  // Opening a note always shows the right column.
  const openNote = (id: string) => {
    setOpenId(id);
    setCollapsed(false);
  };

  async function createNote() {
    setError("");
    const { data, error } = await supabase
      .from("notes")
      .insert({ notebook_id: notebookId, title: "New Note" })
      .select("id, title, content")
      .single();
    if (error) return setError(error.message);
    setNotes((ns) => [...ns, data]);
    openNote(data.id);
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
    <div
      className={`grid min-h-0 flex-1 grid-cols-1 gap-3 px-3 pb-3 transition-[grid-template-columns] duration-300 ${
        collapsed ? "lg:grid-cols-[320px_minmax(0,1fr)_40px]" : "lg:grid-cols-[320px_minmax(0,1fr)_360px]"
      }`}
    >
      <SourcesPanel
        sources={sources}
        selected={selected}
        onToggle={toggle}
        onToggleAll={toggleAll}
        notes={notes}
        openNoteId={openId}
        onCreateNote={createNote}
        onOpenNote={openNote}
        onRenameNote={(id, title) => {
          patch(id, { title });
          saveNote(id, { title });
        }}
        onRemoveNote={removeNote}
      />
      <ChatPanel sourceIds={[...selected]} />
      <div className="relative min-h-0 lg:overflow-hidden">
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            aria-label="Expand panel"
            className="absolute left-1/2 top-4 hidden -translate-x-1/2 rounded-full p-1 text-foreground/60 hover:bg-foreground/10 lg:block"
          >
            <Icon name="panel" className="size-4" />
          </button>
        )}
        {/* Stays mounted when collapsed so an open note keeps its text and autosave. */}
        <div className={`flex h-full min-h-0 flex-col gap-2 lg:w-[360px] [&>section]:flex-1 ${collapsed ? "lg:invisible" : ""}`}>
        {error && <p role="alert" className="rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-300">{error}</p>}
        {open ? (
          <NoteEditor
            key={open.id}
            note={open}
            onChange={(fields) => patch(open.id, fields)}
            onSave={(fields) => saveNote(open.id, fields)}
            onRemove={() => removeNote(open.id)}
            onClose={() => setOpenId(null)}
            onCollapse={() => setCollapsed(true)}
          />
        ) : (
          <StudioPanel onCollapse={() => setCollapsed(true)} />
        )}
        </div>
      </div>
    </div>
  );
}
