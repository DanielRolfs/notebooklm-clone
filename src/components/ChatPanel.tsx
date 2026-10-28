"use client";

import { useState } from "react";
import { streamChat, type Citation } from "@/lib/api";
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

const starters = ["Summarize my sources", "What are the key points?", "What topics do the sources cover?"];

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

export function ChatPanel({ sourceIds }: { sourceIds: string[] }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const canSend = !busy && sourceIds.length > 0;

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
          {turns.length === 0 && (
            <div className="pt-6">
              <p className="mb-8 text-6xl">👋</p>
              <h2 className="mb-4 text-4xl font-light">Let&apos;s start your notebook...</h2>
              <p className="mb-6 text-sm text-foreground/70">
                This is your blank canvas to understand, create, or make progress on something new. Add your own sources, tick the
                ones you want to use, and ask questions about them.
              </p>
              <p className="mb-3 text-sm font-medium">What would you like this notebook to help you do?</p>
              <div className="flex flex-col items-start gap-2">
                {starters.map((s) => (
                  <button key={s} onClick={() => setInput(s)} className="rounded-full bg-foreground/[0.06] px-4 py-2 text-sm hover:bg-foreground/10">
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
                <h2 className="mb-3 text-3xl font-light leading-tight">{t.question}</h2>
                <p className="mb-6 text-sm">
                  {t.sourceCount} {t.sourceCount === 1 ? "source" : "sources"} · {t.date}
                </p>
                <p className="whitespace-pre-wrap text-[15px] leading-7 text-foreground/85">
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
                    <OutOfScope className="border border-foreground/10">
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
                  <div className="mt-8 grid gap-3 sm:grid-cols-3">
                    {t.suggestions.map((q) => (
                      <button
                        key={q}
                        onClick={() => ask(q)}
                        disabled={!canSend}
                        className="flex min-h-32 flex-col justify-between gap-4 rounded-3xl bg-foreground/[0.06] p-4 text-left text-sm hover:bg-foreground/10 disabled:opacity-50"
                      >
                        {q}
                        <Icon name="arrowRight" className="size-4" />
                      </button>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>

      <div className="mx-auto w-full max-w-3xl px-4 pb-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(input.trim());
          }}
          className="flex items-center gap-3 rounded-full bg-panel px-4 py-2 shadow-sm"
        >
          <OutOfScope label="Chat settings" className="!p-1">
            <Icon name="tune" />
          </OutOfScope>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question or create something"
            className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none"
          />
          <span className="text-sm text-foreground/60">
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
