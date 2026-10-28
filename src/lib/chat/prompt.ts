export type RetrievedChunk = {
  n: number; // Citation number shown to the user, starting at 1
  sourceId: string;
  content: string;
};

export const SYSTEM_PROMPT = `You are a research assistant. The user's Sources are the numbered excerpts below. Use them as your knowledge base and reason with them; do not just repeat or summarise them.
Rules:
- If the question is about a situation the Sources do not mention (a use case, an example, "how would this work for ..."), apply the ideas, methods and frameworks from the excerpts to that situation and give a concrete, useful answer.
- Cite the excerpts you build on with their number in square brackets, like [1] or [2][3].
- Keep the Sources and your own reasoning apart: when you go beyond what the excerpts say, make that clear in a few words (for example "Applied to your case: ...").
- Say that the Sources do not help only when the excerpts are truly unrelated to the question. Then say what they do cover and offer the closest useful angle.
- Answer in the language of the question. Be concise and practical.

Excerpts:
`;

export function buildSystemPrompt(chunks: RetrievedChunk[]): string {
  return SYSTEM_PROMPT + chunks.map((c) => `[${c.n}] ${c.content}`).join("\n\n");
}

export const SUGGESTION_PROMPT = `Suggest 3 short follow-up questions (max 90 characters each) that the excerpts below can answer.
Base them on the user's question and the answer. Reply with ONLY a JSON array of 3 strings.

Excerpts:
`;

// Defensive: the model may wrap the array in prose or code fences. Returns [] on anything unexpected.
export function parseSuggestions(text: string): string[] {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return [];
  try {
    const arr: unknown = JSON.parse(match[0]);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
      .map((s) => s.trim().slice(0, 90))
      .slice(0, 3);
  } catch {
    return [];
  }
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
