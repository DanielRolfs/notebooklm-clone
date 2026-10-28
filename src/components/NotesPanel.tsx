"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { OutOfScope } from "./Tooltip";

export type Note = { id: string; title: string; content: string };

export function NotesPanel({ notebookId, initialNotes }: { notebookId: string; initialNotes: Note[] }) {
  const [supabase] = useState(createClient);
  const [notes, setNotes] = useState(initialNotes);
  const [openId, setOpenId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const open = notes.find((n) => n.id === openId);

  const patch = (id: string, fields: Partial<Note>) =>
    setNotes((ns) => ns.map((n) => (n.id === id ? { ...n, ...fields } : n)));

  async function create() {
    setError("");
    const { data, error } = await supabase
      .from("notes")
      .insert({ notebook_id: notebookId })
      .select("id, title, content")
      .single();
    if (error) return setError(error.message);
    setNotes((ns) => [...ns, data]);
    setOpenId(data.id);
  }

  async function save(id: string, fields: Partial<Note>) {
    const { error } = await supabase
      .from("notes")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", id);
    setError(error ? `Could not save: ${error.message}` : "");
  }

  async function remove(id: string) {
    setError("");
    const { error } = await supabase.from("notes").delete().eq("id", id);
    if (error) return setError(error.message);
    setNotes((ns) => ns.filter((n) => n.id !== id));
    setOpenId(null);
    setMenuId(null);
  }

  return (
    <section className="flex min-h-0 flex-col rounded-xl border border-foreground/10 p-3">
      <h2 className="mb-3 text-sm font-medium">Notes</h2>
      {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
      {open ? (
        <NoteEditor
          key={open.id}
          note={open}
          onBack={() => setOpenId(null)}
          onChange={(fields) => patch(open.id, fields)}
          onSave={(fields) => save(open.id, fields)}
          onRemove={() => remove(open.id)}
        />
      ) : (
        <>
          <div className="mb-3 flex flex-wrap gap-2">
            <OutOfScope>Audio Overview</OutOfScope>
            <OutOfScope>Mind Map</OutOfScope>
          </div>
          <button onClick={create} className="mb-3 rounded-full border border-foreground/20 py-2 text-sm hover:bg-foreground/5">
            + New note
          </button>
          {notes.length > 0 && <p className="mb-1 text-xs uppercase tracking-wide text-foreground/50">Notes folder</p>}
          <ul className="min-h-0 flex-1 overflow-y-auto">
            {notes.map((n) => (
              <li key={n.id} className="relative flex items-center rounded-md px-1 hover:bg-foreground/5">
                {renamingId === n.id ? (
                  <input
                    autoFocus
                    defaultValue={n.title}
                    aria-label="Note title"
                    className="my-1 min-w-0 flex-1 rounded border border-foreground/20 bg-transparent px-2 py-1 text-sm"
                    onBlur={(e) => {
                      const title = e.target.value.trim() || n.title;
                      patch(n.id, { title });
                      save(n.id, { title });
                      setRenamingId(null);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                  />
                ) : (
                  <button onClick={() => setOpenId(n.id)} className="min-w-0 flex-1 truncate py-2 text-left text-sm">
                    {n.title}
                  </button>
                )}
                <button
                  aria-label={`Actions for ${n.title}`}
                  onClick={() => setMenuId(menuId === n.id ? null : n.id)}
                  className="px-2 text-foreground/60"
                >
                  ⋮
                </button>
                {menuId === n.id && (
                  <div className="absolute right-0 top-full z-30 w-36 rounded-md border border-foreground/20 bg-background py-1 text-sm shadow-lg">
                    <button
                      className="block w-full px-3 py-1.5 text-left hover:bg-foreground/5"
                      onClick={() => {
                        setRenamingId(n.id);
                        setMenuId(null);
                      }}
                    >
                      Rename note
                    </button>
                    <button
                      className="block w-full px-3 py-1.5 text-left hover:bg-foreground/5"
                      onClick={() => remove(n.id)}
                    >
                      Remove note
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function NoteEditor({
  note,
  onBack,
  onChange,
  onSave,
  onRemove,
}: {
  note: Note;
  onBack: () => void;
  onChange: (fields: Partial<Note>) => void;
  onSave: (fields: Partial<Note>) => void;
  onRemove: () => void;
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
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-sm text-foreground/60 hover:underline">
          ← Notes
        </button>
        <button onClick={onRemove} className="rounded-md border border-foreground/20 px-3 py-1 text-sm hover:bg-red-500/10">
          Remove
        </button>
      </div>
      <input
        value={note.title}
        onChange={(e) => onChange({ title: e.target.value })}
        onBlur={flush}
        aria-label="Note title"
        className="rounded-md border border-foreground/20 bg-transparent px-3 py-2 text-sm font-medium"
      />
      <textarea
        value={note.content}
        onChange={(e) => onChange({ content: e.target.value })}
        onBlur={flush}
        aria-label="Note text"
        placeholder="Write your note"
        className="min-h-0 flex-1 resize-none rounded-md border border-foreground/20 bg-transparent px-3 py-2 text-sm"
      />
    </div>
  );
}
