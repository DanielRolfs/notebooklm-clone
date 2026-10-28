"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { addSource } from "@/lib/api";
import { Tooltip } from "./Tooltip";

export type Source = {
  id: string;
  title: string;
  type: "file" | "website" | "youtube" | "text";
  status: "pending" | "processing" | "ready" | "failed";
};

const badge: Record<Source["status"], string> = {
  pending: "bg-foreground/10 text-foreground/60",
  processing: "bg-amber-500/20 text-amber-700 dark:text-amber-300",
  ready: "bg-green-500/20 text-green-700 dark:text-green-300",
  failed: "bg-red-500/20 text-red-700 dark:text-red-300",
};

export function SourcesPanel({
  sources,
  selected,
  onToggle,
}: {
  sources: Source[];
  selected: Set<string>;
  onToggle: (id: string) => void;
}) {
  const router = useRouter();
  const [dialog, setDialog] = useState(false);
  const [error, setError] = useState("");
  const working = sources.some((s) => s.status === "pending" || s.status === "processing");

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

  return (
    <section className="flex min-h-0 flex-col rounded-xl border border-foreground/10 p-3">
      <h2 className="mb-3 text-sm font-medium">Sources</h2>
      <button
        onClick={() => setDialog(true)}
        className="mb-3 rounded-full border border-foreground/20 py-2 text-sm hover:bg-foreground/5"
      >
        + Add source
      </button>
      {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
      {sources.length === 0 && (
        <p className="mt-6 text-center text-sm text-foreground/60">
          Saved sources will appear here. Add files or pasted text, then ask questions about them.
        </p>
      )}
      <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto">
        {sources.map((s) => (
          <li key={s.id} className="flex items-center gap-2 rounded-md px-1 py-1.5 hover:bg-foreground/5">
            <input
              type="checkbox"
              aria-label={`Use ${s.title} for chat`}
              checked={selected.has(s.id)}
              disabled={s.status !== "ready"}
              onChange={() => onToggle(s.id)}
            />
            <span className="min-w-0 flex-1 truncate text-sm" title={s.title}>
              {s.title}
            </span>
            <span className={`rounded px-1.5 py-0.5 text-xs ${badge[s.status]}`}>{s.status}</span>
            <button
              onClick={() => remove(s.id)}
              aria-label={`Remove ${s.title}`}
              className="text-foreground/50 hover:text-red-600"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      {dialog && (
        <AddSourceDialog
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

function AddSourceDialog({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [mode, setMode] = useState<"upload" | "text">("upload");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  async function submit(input: Parameters<typeof addSource>[0]) {
    setBusy(true);
    setError("");
    try {
      await addSource(input);
      onAdded();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setBusy(false);
    }
  }

  const tab = (active: boolean) =>
    `rounded-full border px-3 py-1.5 text-sm ${active ? "border-foreground bg-foreground/10" : "border-foreground/20"}`;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-label="Add source"
        className="w-full max-w-lg rounded-xl bg-background p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-3 font-medium">Add sources</h3>
        <div className="mb-4 flex flex-wrap gap-2">
          <button className={tab(mode === "upload")} onClick={() => setMode("upload")}>
            Upload files
          </button>
          <button className={tab(mode === "text")} onClick={() => setMode("text")}>
            Copied text
          </button>
          {["Websites", "YouTube"].map((label) => (
            <Tooltip key={label} text="Coming in a later step">
              <button disabled className={`${tab(false)} cursor-not-allowed opacity-40`}>
                {label}
              </button>
            </Tooltip>
          ))}
        </div>

        {mode === "upload" ? (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file) submit({ file });
            }}
            className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-foreground/30 p-8 text-sm"
          >
            <p>Drag and drop a file here, or</p>
            <input
              ref={fileInput}
              type="file"
              accept=".pdf,.txt,.md,text/plain,text/markdown,application/pdf"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) submit({ file });
              }}
            />
            <button
              disabled={busy}
              onClick={() => fileInput.current?.click()}
              className="rounded-md border border-foreground/20 px-3 py-1.5 hover:bg-foreground/5 disabled:opacity-50"
            >
              Choose file
            </button>
            <p className="text-xs text-foreground/60">PDF, text or Markdown, up to 10 MB.</p>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit({ title: title.trim(), text });
            }}
            className="flex flex-col gap-2"
          >
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="rounded-md border border-foreground/20 bg-transparent px-3 py-2 text-sm"
            />
            <textarea
              required
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste text here"
              rows={8}
              className="rounded-md border border-foreground/20 bg-transparent px-3 py-2 text-sm"
            />
            <button
              disabled={busy}
              className="self-end rounded-md bg-foreground px-4 py-1.5 text-sm text-background disabled:opacity-50"
            >
              Insert
            </button>
          </form>
        )}

        {busy && <p className="mt-3 text-sm text-foreground/60">Uploading...</p>}
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="mt-4 flex justify-end">
          <button onClick={onClose} className="text-sm text-foreground/60 hover:underline">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
