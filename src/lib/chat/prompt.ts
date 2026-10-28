export type RetrievedChunk = {
  n: number; // Citation number shown to the user, starting at 1
  sourceId: string;
  content: string;
};

export const SYSTEM_PROMPT = `You answer questions about the user's Sources.
Rules:
- Answer ONLY from the numbered excerpts below. Never use outside knowledge.
- Cite every claim with the excerpt number in square brackets, like [1] or [2][3].
- If the excerpts do not cover the question, say you do not know based on the Sources.
- Be concise.

Excerpts:
`;

export function buildSystemPrompt(chunks: RetrievedChunk[]): string {
  return SYSTEM_PROMPT + chunks.map((c) => `[${c.n}] ${c.content}`).join("\n\n");
}

// Numbers the model actually cited, e.g. "[1][3]" -> {1, 3}.
export function citedNumbers(answer: string): Set<number> {
  return new Set([...answer.matchAll(/\[(\d+)\]/g)].map((m) => Number(m[1])));
}

// Plain check, no test framework yet (vitest lands on another branch):
// whoever owns the tests can wrap this in `expect(citedNumbersSelfCheck()).toBe(true)`.
export function citedNumbersSelfCheck(): boolean {
  const s = citedNumbers("A [1] and [3][3]");
  return s.size === 2 && s.has(1) && s.has(3);
}
