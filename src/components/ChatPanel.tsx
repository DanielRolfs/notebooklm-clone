"use client";

import { useState } from "react";
import { streamChat, type Citation } from "@/lib/api";
import { OutOfScope, Tooltip } from "./Tooltip";

type Message = { role: "user" | "assistant"; text: string; citations?: Citation[]; error?: string };

// Turns "[1]" markers into hoverable Citations showing the Source title and snippet.
function AnswerText({ text, citations = [] }: { text: string; citations?: Citation[] }) {
  return (
    <>
      {text.split(/(\[\d+\])/).map((part, i) => {
        const n = /^\[(\d+)\]$/.exec(part)?.[1];
        const c = n ? citations.find((c) => c.n === Number(n)) : undefined;
        if (!c) return <span key={i}>{part}</span>;
        return (
          <Tooltip key={i} text={`${c.sourceTitle}: ${c.snippet}`}>
            <sup className="cursor-help rounded bg-foreground/10 px-1 text-xs">{c.n}</sup>
          </Tooltip>
        );
      })}
    </>
  );
}

export function ChatPanel({ sourceIds }: { sourceIds: string[] }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  // Always updates the last (assistant) message, which is the one being streamed.
  const patchLast = (fn: (m: Message) => Message) =>
    setMessages((ms) => ms.map((m, i) => (i === ms.length - 1 ? fn(m) : m)));

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const question = input.trim();
    if (!question || busy || sourceIds.length === 0) return;
    setInput("");
    setBusy(true);
    setMessages((ms) => [...ms, { role: "user", text: question }, { role: "assistant", text: "" }]);
    try {
      await streamChat(question, sourceIds, {
        text: (delta) => patchLast((m) => ({ ...m, text: m.text + delta })),
        citations: (items) => patchLast((m) => ({ ...m, citations: items })),
      });
    } catch (err) {
      patchLast((m) => ({ ...m, error: err instanceof Error ? err.message : "Chat failed" }));
    }
    setBusy(false);
  }

  return (
    <section className="flex min-h-0 flex-col rounded-xl border border-foreground/10 p-3">
      <h2 className="mb-3 text-sm font-medium">Chat</h2>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
        {messages.length === 0 && (
          <p className="mt-10 text-center text-sm text-foreground/60">
            Tick one or more Sources, then ask a question about them.
          </p>
        )}
        {messages.map((m, i) =>
          m.role === "user" ? (
            <p key={i} className="ml-auto w-fit max-w-[85%] rounded-2xl bg-foreground/10 px-3 py-2 text-sm">
              {m.text}
            </p>
          ) : (
            <div key={i} className="text-sm leading-relaxed">
              <p className="whitespace-pre-wrap">
                <AnswerText text={m.text} citations={m.citations} />
                {busy && i === messages.length - 1 && !m.error && <span className="animate-pulse"> ...</span>}
              </p>
              {m.error && (
                <p role="alert" className="mt-2 rounded-md bg-red-500/10 px-3 py-2 text-red-700 dark:text-red-300">
                  Chat failed: {m.error}
                </p>
              )}
              {m.text && !busy && (
                <div className="mt-2">
                  <OutOfScope>Save to note</OutOfScope>
                </div>
              )}
            </div>
          ),
        )}
      </div>
      <form onSubmit={send} className="mt-3 flex items-center gap-2 rounded-full border border-foreground/20 px-3 py-1.5">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about your sources"
          className="min-w-0 flex-1 bg-transparent py-1 text-sm outline-none"
        />
        <span className="text-xs text-foreground/60">{sourceIds.length} sources</span>
        <button
          disabled={busy || !input.trim() || sourceIds.length === 0}
          title={sourceIds.length === 0 ? "Tick at least one source" : undefined}
          className="rounded-full bg-foreground px-3 py-1 text-sm text-background disabled:opacity-30"
        >
          Send
        </button>
      </form>
    </section>
  );
}
