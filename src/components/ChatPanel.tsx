"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createGuide, streamChat, type Citation } from "@/lib/api";
import { sameIds, type Guide } from "@/lib/guide";
import { DriveIcon } from "./BrandIcons";
import { Icon } from "./Icons";
import { OutOfScope, Tooltip } from "./Tooltip";

type Turn = {
  question: string;
  sourceCount: number;
  date: string;
  answer: string;
  citations: Citation[];
  suggestions: string[];
  error?: string;
};

const starters = ["Learn about a new topic", "Create something new", "Make progress on a project"];

// Tiny renderer: **bold** and [n] Citations. Text goes through React, so no raw HTML is injected.
function Answer({ text, citations }: { text: string; citations: Citation[] }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*|\[\d+\])/).map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**") && part.length > 4) return <strong key={i}>{part.slice(2, -2)}</strong>;
        const n = /^\[(\d+)\]$/.exec(part)?.[1];
        const c = n ? citations.find((c) => c.n === Number(n)) : undefined;
        if (!c) return <span key={i}>{part}</span>;
        return (
          <Tooltip key={i} text={`${c.sourceTitle}: ${c.snippet}`}>
            <sup className="mx-0.5 cursor-help rounded bg-foreground/10 px-1 text-xs">{c.n}</sup>
          </Tooltip>
        );
      })}
    </>
  );
}

function SuggestionCards({ items, onAsk, disabled }: { items: string[]; onAsk: (q: string) => void; disabled: boolean }) {
  return (
    <div className="mt-8 grid gap-3 sm:grid-cols-3">
      {items.map((q) => (
        <button
          key={q}
          onClick={() => onAsk(q)}
          disabled={disabled}
          className="flex min-h-32 flex-col justify-between gap-4 rounded-3xl bg-foreground/[0.06] p-5 text-left hover:bg-foreground/10 disabled:opacity-50"
        >
          {q}
          <Icon name="cornerDownRight" className="size-4" />
        </button>
      ))}
    </div>
  );
}

// sourceIds: the ticked Sources (chat scope). readyIds: all ready Sources (what the guide covers), sorted.
export function ChatPanel({ sourceIds, readyIds, guide }: { sourceIds: string[]; readyIds: string[]; guide: Guide | null }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [driveHint, setDriveHint] = useState(true);
  const canSend = !busy && sourceIds.length > 0;

  // Guide: made once whenever the ready Sources differ from the stored guide. A failure is not
  // retried automatically; the "Try again" button bumps `attempt` instead.
  const router = useRouter();
  const inFlight = useRef(false);
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState<{ key: string; message: string } | null>(null);
  const readyKey = readyIds.join(",");
  const upToDate = readyIds.length > 0 ? !!guide && sameIds(guide.sourceIds, readyIds) : !guide;
  const failure = failed?.key === readyKey ? failed.message : "";

  useEffect(() => {
    if (upToDate || failure || inFlight.current) return;
    inFlight.current = true;
    createGuide()
      .then(() => router.refresh())
      .catch((err) => setFailed({ key: readyKey, message: err instanceof Error ? err.message : "Could not create the summary." }))
      .finally(() => {
        inFlight.current = false;
        setAttempt((n) => n + 1); // re-check: the Sources may have changed meanwhile
      });
  }, [upToDate, failure, readyKey, attempt, router]);

  // Always updates the last turn, which is the one being streamed.
  const patchLast = (fn: (t: Turn) => Turn) => setTurns((ts) => ts.map((t, i) => (i === ts.length - 1 ? fn(t) : t)));

  async function ask(question: string) {
    if (!question || !canSend) return;
    setInput("");
    setBusy(true);
    const date = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    setTurns((ts) => [...ts, { question, sourceCount: sourceIds.length, date, answer: "", citations: [], suggestions: [] }]);
    try {
      await streamChat(question, sourceIds, {
        text: (delta) => patchLast((t) => ({ ...t, answer: t.answer + delta })),
        citations: (items) => patchLast((t) => ({ ...t, citations: items })),
        suggestions: (items) => patchLast((t) => ({ ...t, suggestions: items })),
      });
    } catch (err) {
      patchLast((t) => ({ ...t, error: err instanceof Error ? err.message : "Chat failed" }));
    }
    setBusy(false);
  }

  const copy = (text: string) => navigator.clipboard?.writeText(text).catch(() => {});

  return (
    <section className="flex min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-4">
        <div className="mx-auto max-w-3xl pb-6 pt-4">
          {readyIds.length > 0 && (
            <article className="mb-10">
              {upToDate && guide ? (
                <>
                  {guide.emoji && (
                    <div aria-hidden="true" className="mb-10 text-6xl">
                      {guide.emoji}
                    </div>
                  )}
                  <h2 className="mb-3 text-4xl font-light leading-[44px]">{guide.title}</h2>
                  <p className="mb-6">
                    {guide.sourceIds.length} {guide.sourceIds.length === 1 ? "source" : "sources"} ·{" "}
                    {new Date(guide.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                  <p className="text-base text-foreground/85">
                    <Answer text={guide.summary} citations={[]} />
                  </p>
                  <div className="mt-5 flex items-center gap-1">
                    <OutOfScope>
                      <Icon name="pin" className="size-4" /> Save to note
                    </OutOfScope>
                    <button onClick={() => copy(guide.summary.replaceAll("**", ""))} aria-label="Copy summary" className="rounded-full p-2 hover:bg-foreground/10">
                      <Icon name="copy" className="size-4" />
                    </button>
                    <OutOfScope label="Good answer" className="!p-2">
                      <Icon name="thumb" className="size-4" />
                    </OutOfScope>
                    <OutOfScope label="Bad answer" className="!p-2">
                      <Icon name="thumb" className="size-4 rotate-180" />
                    </OutOfScope>
                  </div>
                  <SuggestionCards items={guide.suggestions} onAsk={ask} disabled={!canSend} />
                </>
              ) : failure ? (
                <p role="alert" className="flex flex-wrap items-center gap-3 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                  Could not create the summary: {failure}
                  <button onClick={() => { setFailed(null); setAttempt((n) => n + 1); }} className="rounded-full border border-current px-3 py-1">
                    Try again
                  </button>
                </p>
              ) : (
                <div aria-live="polite" className="animate-pulse">
                  <p className="mb-4 text-sm text-foreground/60">Creating summary...</p>
                  <div className="mb-3 h-8 w-2/3 rounded-lg bg-foreground/10" />
                  <div className="space-y-2">
                    <div className="h-4 rounded bg-foreground/10" />
                    <div className="h-4 rounded bg-foreground/10" />
                    <div className="h-4 w-4/5 rounded bg-foreground/10" />
                  </div>
                </div>
              )}
            </article>
          )}

          {turns.length === 0 && readyIds.length === 0 && (
            <div className="pt-6">
              <p className="mb-8 text-6xl">👋</p>
              <h2 className="mb-5 text-[28px] font-light leading-9">Let&apos;s start your notebook...</h2>
              <p className="mb-6 text-foreground/75">
                This is your blank canvas to understand, create, or make progress on something new. I can help you get started or you
                can go ahead and add your own sources.
              </p>
              <p className="mb-3 font-medium">What would you like this notebook to help you do?</p>
              <div className="flex flex-col items-start gap-2">
                {starters.map((s) => (
                  <button key={s} onClick={() => setInput(s)} className="rounded-full bg-foreground/[0.06] px-4 py-2 text-[13px] hover:bg-foreground/10">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {turns.map((t, i) => {
            const last = i === turns.length - 1;
            return (
              <article key={i} className="mb-10">
                <div className="mb-2 flex justify-end">
                  <h2 className="max-w-[85%] whitespace-pre-wrap rounded-3xl bg-foreground/[0.06] px-5 py-3 text-base">{t.question}</h2>
                </div>
                <p className="mb-5 text-right text-xs text-foreground/50">
                  {t.sourceCount} {t.sourceCount === 1 ? "source" : "sources"} · {t.date}
                </p>
                <p className="whitespace-pre-wrap text-base text-foreground/85">
                  <Answer text={t.answer} citations={t.citations} />
                  {busy && last && !t.error && <span className="animate-pulse"> ...</span>}
                </p>
                {t.error && (
                  <p role="alert" className="mt-3 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                    Chat failed: {t.error}
                  </p>
                )}
                {t.answer && !(busy && last) && (
                  <div className="mt-5 flex items-center gap-1">
                    <OutOfScope>
                      <Icon name="pin" className="size-4" /> Save to note
                    </OutOfScope>
                    <button onClick={() => copy(t.answer)} aria-label="Copy answer" className="rounded-full p-2 hover:bg-foreground/10">
                      <Icon name="copy" className="size-4" />
                    </button>
                    <OutOfScope label="Good answer" className="!p-2">
                      <Icon name="thumb" className="size-4" />
                    </OutOfScope>
                    <OutOfScope label="Bad answer" className="!p-2">
                      <Icon name="thumb" className="size-4 rotate-180" />
                    </OutOfScope>
                  </div>
                )}
                {last && !busy && t.suggestions.length > 0 && (
                  <SuggestionCards items={t.suggestions} onAsk={ask} disabled={!canSend} />
                )}
              </article>
            );
          })}
        </div>
      </div>

      <div className="mx-auto w-full max-w-3xl px-4 pb-2">
        {driveHint && (
          <div className="mx-3 -mb-3 flex items-center gap-3 rounded-t-2xl bg-indigo-500/10 px-3 pb-5 pt-2 text-xs">
            <DriveIcon className="size-5 shrink-0" />
            <p className="flex-1">You can now search Google Drive files from chat. Try asking, &quot;search my Drive for...&quot;</p>
            <button onClick={() => setDriveHint(false)} aria-label="Dismiss Drive hint" className="text-foreground/60">
              <Icon name="close" className="size-4" />
            </button>
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(input.trim());
          }}
          className="relative flex items-center gap-3 rounded-full bg-panel px-4 py-2.5 shadow-sm"
        >
          <OutOfScope label="Chat settings" className="!p-1">
            <Icon name="tune" />
          </OutOfScope>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question or create something"
            className="min-w-0 flex-1 bg-transparent py-2 text-base outline-none"
          />
          <span className="text-[13px] text-foreground/60">
            {sourceIds.length} {sourceIds.length === 1 ? "source" : "sources"}
          </span>
          <button
            disabled={!canSend || !input.trim()}
            aria-label="Send"
            title={sourceIds.length === 0 ? "Tick at least one source" : undefined}
            className="flex size-10 items-center justify-center rounded-full bg-foreground text-background disabled:bg-foreground/15 disabled:text-foreground/40"
          >
            <Icon name="arrowUp" />
          </button>
        </form>
        <p className="mt-2 text-center text-xs text-foreground/60">NotebookLM Clone can make mistakes, so double-check it.</p>
      </div>
    </section>
  );
}
