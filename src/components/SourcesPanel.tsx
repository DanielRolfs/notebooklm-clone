"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { addSource } from "@/lib/api";
import { Icon, type IconName } from "./Icons";
import { OutOfScope, Tooltip } from "./Tooltip";

export type Source = {
  id: string;
  title: string;
  type: "file" | "website" | "youtube" | "text";
  status: "pending" | "processing" | "ready" | "failed";
};
export type Note = { id: string; title: string; content: string };

const MAX_SOURCES = 50;
const badge: Record<Source["status"], string> = {
  pending: "bg-foreground/10 text-foreground/60",
  processing: "bg-amber-500/20 text-amber-700 dark:text-amber-300",
  ready: "",
  failed: "bg-red-500/20 text-red-700 dark:text-red-300",
};

// Blue markdown/text file icon, red for PDFs; links and videos keep their glyph.
function SourceIcon({ source }: { source: Source }) {
  if (source.type === "website" || source.type === "youtube") return <Icon name={source.type === "website" ? "link" : "play"} className="size-5 text-indigo-600" />;
  const pdf = /\.pdf$/i.test(source.title);
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`size-5 shrink-0 ${pdf ? "stroke-red-600" : "stroke-blue-600"}`}>
      <rect x="2.5" y="5" width="19" height="14" rx="1.5" />
      {pdf ? <path d="M7 15v-5h2a1.5 1.5 0 010 3H7M12 15v-5M15 10h2.5M15 12.5h2" /> : <path d="M6 15v-4l2 2.5 2-2.5v4M16 10v5M14 13l2 2 2-2" />}
    </svg>
  );
}

// Three-dot menu; the full-screen button behind it closes it on any outside click.
function RowMenu({ label, items }: { label: string; items: { text: string; icon: IconName; run: () => void }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} aria-label={label} className="rounded-full p-1 text-foreground/60 hover:bg-foreground/10">
        <Icon name="more" className="size-4" />
      </button>
      {open && (
        <>
          <button aria-label="Close menu" className="fixed inset-0 z-30 cursor-default" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-40 mt-1 w-48 rounded-2xl border border-foreground/10 bg-panel py-2 shadow-lg">
            {items.map((item) => (
              <button
                key={item.text}
                className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-foreground/5"
                onClick={() => {
                  setOpen(false);
                  item.run();
                }}
              >
                <Icon name={item.icon} className="size-4" /> {item.text}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function SourcesPanel({
  sources,
  selected,
  onToggle,
  onToggleAll,
  notes,
  openNoteId,
  onCreateNote,
  onOpenNote,
  onRenameNote,
  onRemoveNote,
}: {
  sources: Source[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: (checked: boolean) => void;
  notes: Note[];
  openNoteId: string | null;
  onCreateNote: () => void;
  onOpenNote: (id: string) => void;
  onRenameNote: (id: string, title: string) => void;
  onRemoveNote: (id: string) => void;
}) {
  const router = useRouter();
  const [dialog, setDialog] = useState(false);
  const [banner, setBanner] = useState(true);
  const [notesOpen, setNotesOpen] = useState(true);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const working = sources.some((s) => s.status === "pending" || s.status === "processing");
  const ready = sources.filter((s) => s.status === "ready");

  // Ingestion runs on the server after the upload returns, so poll until nothing is in progress.
  useEffect(() => {
    if (!working) return;
    const t = setInterval(() => router.refresh(), 3000);
    return () => clearInterval(t);
  }, [working, router]);

  async function remove(id: string) {
    setError("");
    const { error } = await createClient().from("sources").delete().eq("id", id);
    if (error) return setError(error.message);
    router.refresh();
  }

  // Files dropped anywhere on the column start an upload, one after the other.
  async function dropFiles(files: File[]) {
    setUploading(true);
    setError("");
    try {
      for (const file of files) await addSource({ file });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    }
    setUploading(false);
    router.refresh();
  }

  return (
    <section
      className="flex min-h-0 flex-col rounded-3xl bg-panel p-4"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        dropFiles([...e.dataTransfer.files]);
      }}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2>Sources</h2>
        <OutOfScope className="!p-1" align="right" label="Collapse">
          <Icon name="panelLeft" className="size-4" />
        </OutOfScope>
      </div>

      {banner && (
        <div className="mb-3 flex items-start gap-2 rounded-2xl bg-indigo-500/10 p-3 text-xs">
          <span aria-hidden="true">📝</span>
          <p className="flex-1">
            <strong className="block font-medium">Meet the new notes!</strong>
            Notes now live with your sources. You can chat, cite, and generate from them
          </p>
          <button onClick={() => setBanner(false)} aria-label="Dismiss" className="text-foreground/60">
            <Icon name="close" className="size-4" />
          </button>
        </div>
      )}

      <div className="mb-3 grid grid-cols-2 gap-2">
        <button
          onClick={() => setDialog(true)}
          className="flex items-center justify-center gap-2 rounded-full bg-foreground/[0.06] py-3 font-medium hover:bg-foreground/10"
        >
          <Icon name="plus" className="size-4" /> Add sources
        </button>
        <button
          onClick={onCreateNote}
          className="flex items-center justify-center gap-2 rounded-full bg-foreground/[0.06] py-3 font-medium hover:bg-foreground/10"
        >
          <Icon name="plus" className="size-4" /> Create note
        </button>
      </div>

      <Tooltip text="Not part of this clone's scope" block>
        <div aria-disabled="true" className="mb-3 w-full cursor-not-allowed rounded-3xl bg-foreground/[0.06] p-4 text-foreground/35">
          <p className="mb-4">Search the web for new sources</p>
          <div className="flex items-center gap-2">
            <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-panel px-3 py-1.5">
              <Icon name="globe" className="size-4 shrink-0" /> Web <Icon name="chevron" className="size-3.5 shrink-0" />
            </span>
            <span className="flex min-w-0 items-center gap-1.5 rounded-full bg-panel px-3 py-1.5">
              <Icon name="search" className="size-4 shrink-0" /> <span className="min-w-0 truncate">Fast Research</span> <Icon name="chevron" className="size-3.5 shrink-0" />
            </span>
            <Icon name="arrowRight" className="ml-auto size-4 shrink-0" />
          </div>
        </div>
      </Tooltip>

      {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
      {uploading && <p className="mb-2 text-xs text-foreground/60">Uploading...</p>}

      {sources.length === 0 && notes.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1 px-4 text-center text-foreground/60">
          <Icon name="doc" className="mb-2 size-6" />
          <p className="font-medium text-foreground/80">Saved sources will appear here</p>
          <p>Add files, websites, or more. Then ask questions or create things based on these sources.</p>
          <p>
            Drop files here or{" "}
            <button onClick={() => setDialog(true)} className="underline">
              add a source
            </button>
          </p>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <label className="flex h-9 items-center justify-between pl-2.5 pr-2">
            <Icon name="sort" className="size-4 text-foreground/60" />
            <span className="flex items-center">
              Select all
              <input
                type="checkbox"
                checked={ready.length > 0 && ready.every((s) => selected.has(s.id))}
                disabled={ready.length === 0}
                onChange={(e) => onToggleAll(e.target.checked)}
              />
            </span>
          </label>

          {notes.length > 0 && (
            <div className="mb-1">
              <div className="flex h-9 items-center pr-2">
                <button onClick={() => setNotesOpen(!notesOpen)} className="flex flex-1 items-center gap-2 pl-2 text-left">
                  <Icon name="chevron" className={`size-4 transition-transform ${notesOpen ? "" : "-rotate-90"}`} /> Notes
                </button>
                <input type="checkbox" checked disabled readOnly aria-label="Notes included" />
              </div>
              {notesOpen &&
                notes.map((n) => (
                  <div
                    key={n.id}
                    className={`flex h-9 items-center gap-3.5 rounded-lg pl-2.5 pr-2 ${n.id === openNoteId ? "bg-foreground/[0.07]" : "hover:bg-foreground/5"}`}
                  >
                    <Icon name="note" className="size-5" />
                    {renamingId === n.id ? (
                      <input
                        autoFocus
                        defaultValue={n.title}
                        aria-label="Note title"
                        className="min-w-0 flex-1 rounded border border-foreground/20 bg-transparent px-2 py-1 text-sm"
                        onBlur={(e) => {
                          onRenameNote(n.id, e.target.value.trim() || n.title);
                          setRenamingId(null);
                        }}
                        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                      />
                    ) : (
                      <button onClick={() => onOpenNote(n.id)} className="min-w-0 flex-1 truncate text-left">
                        {n.title}
                      </button>
                    )}
                    <RowMenu
                      label={`Actions for ${n.title}`}
                      items={[
                        { text: "Remove note", icon: "trash", run: () => onRemoveNote(n.id) },
                        { text: "Rename note", icon: "pencil", run: () => setRenamingId(n.id) },
                      ]}
                    />
                    {/* Notes are not chat context in this clone, so the box is shown ticked and inert. */}
                    <input type="checkbox" checked disabled readOnly aria-label="Note included" />
                  </div>
                ))}
            </div>
          )}

          {sources.map((s) => (
            <div key={s.id} className="flex h-9 items-center gap-3.5 rounded-lg pl-2.5 pr-2 hover:bg-foreground/5">
              <SourceIcon source={s} />
              <span className="min-w-0 flex-1 truncate" title={s.title}>
                {s.title}
              </span>
              {s.status !== "ready" && <span className={`rounded px-1.5 py-0.5 text-xs ${badge[s.status]}`}>{s.status}</span>}
              <RowMenu label={`Actions for ${s.title}`} items={[{ text: "Remove source", icon: "trash", run: () => remove(s.id) }]} />
              <input
                type="checkbox"
                aria-label={`Use ${s.title} for chat`}
                checked={selected.has(s.id)}
                disabled={s.status !== "ready"}
                onChange={() => onToggle(s.id)}
              />
            </div>
          ))}
        </div>
      )}

      {dialog && (
        <AddSourceDialog
          count={sources.length}
          onClose={() => setDialog(false)}
          onAdded={() => {
            setDialog(false);
            router.refresh();
          }}
        />
      )}
    </section>
  );
}

function AddSourceDialog({ count, onClose, onAdded }: { count: number; onClose: () => void; onAdded: () => void }) {
  const [mode, setMode] = useState<"upload" | "text">("upload");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  async function submit(inputs: Parameters<typeof addSource>[0][]) {
    setBusy(true);
    setError("");
    try {
      for (const input of inputs) await addSource(input);
      onAdded();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setBusy(false);
    }
  }

  const pickFiles = () => {
    if (!busy) fileInput.current?.click();
  };

  const chip = (active: boolean) =>
    `flex items-center gap-2 rounded-full border px-4 py-2 text-sm ${active ? "border-foreground/40 bg-foreground/[0.06]" : "border-foreground/15"}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-label="Add sources"
        className="w-full max-w-2xl rounded-3xl bg-panel p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between">
          <h3 className="flex-1 pl-6 text-center text-2xl">Add sources</h3>
          <button onClick={onClose} aria-label="Close" className="text-foreground/60">
            <Icon name="close" />
          </button>
        </div>
        <div className="mb-5 flex flex-wrap justify-center gap-2">
          <button
            className={chip(mode === "upload")}
            disabled={busy}
            onClick={() => {
              setMode("upload");
              pickFiles();
            }}
          >
            <Icon name="upload" className="size-4" /> Upload files
          </button>
          <Tooltip text="Not part of this clone's scope">
            <button disabled className={`${chip(false)} cursor-not-allowed opacity-40`}>
              <Icon name="link" className="size-4" />
              <Icon name="play" className="size-4 text-red-600" /> Websites
            </button>
          </Tooltip>
          <button className={chip(mode === "text")} onClick={() => setMode("text")}>
            <Icon name="clipboard" className="size-4" /> Copied text
          </button>
        </div>

        {/* Always mounted, so the "Upload files" chip can open the picker from either mode. */}
        <input
          ref={fileInput}
          type="file"
          multiple
          accept=".pdf,.txt,.md,text/plain,text/markdown,application/pdf"
          hidden
          onChange={(e) => {
            const files = [...(e.target.files ?? [])];
            e.target.value = ""; // lets the same file be picked again
            submit(files.map((file) => ({ file })));
          }}
        />
        {mode === "upload" ? (
          <div
            role="button"
            tabIndex={0}
            aria-label="Choose files"
            onClick={pickFiles}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && pickFiles()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation(); // the column behind the dialog also accepts drops
              submit([...e.dataTransfer.files].map((file) => ({ file })));
            }}
            className="flex h-56 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-foreground/25 text-center text-sm text-foreground/60 hover:bg-foreground/[0.03]"
          >
            <Icon name="upload" className="size-7" />
            <p>Drag &amp; drop your files to upload, or click to choose. Supported file types: pdf, txt, md</p>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit([{ title: title.trim(), text }]);
            }}
            className="flex flex-col gap-2"
          >
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="rounded-xl border border-foreground/20 bg-transparent px-3 py-2 text-sm"
            />
            <textarea
              required
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste text here"
              rows={8}
              className="rounded-xl border border-foreground/20 bg-transparent px-3 py-2 text-sm"
            />
            <button disabled={busy} className="self-end rounded-full bg-foreground px-5 py-2 text-sm text-background disabled:opacity-50">
              Insert
            </button>
          </form>
        )}

        {busy && <p className="mt-3 text-sm text-foreground/60">Uploading...</p>}
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="mt-5 flex items-center gap-3">
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-foreground/10">
            <div className="h-full rounded-full bg-foreground" style={{ width: `${Math.min(100, (count / MAX_SOURCES) * 100)}%` }} />
          </div>
          <span className="text-sm text-foreground/70">
            {count} / {MAX_SOURCES}
          </span>
        </div>
      </div>
    </div>
  );
}
