// Pure helpers for the notebook guide, shared by the route and the UI. No network, no database.

export type Guide = {
  emoji?: string; // one emoji above the title; missing on guides made before it existed
  title: string;
  summary: string;
  suggestions: string[]; // exactly 3
  sourceIds: string[]; // sorted ids of the ready Sources the guide was made from
  createdAt: string;
};

export const GUIDE_CHAR_BUDGET = 60_000;

export const GUIDE_PROMPT = `You write the guide for a notebook from the user's Sources.
Reply with ONLY a JSON object: {"emoji": string, "title": string, "summary": string, "suggestions": [string, string, string]}
Rules:
- emoji: ONE emoji that fits the topic.
- title: at most 8 words.
- summary: ONE paragraph of 80 to 130 words covering all Sources. Wrap 3 to 5 key phrases in **double asterisks** for bold. Use only what the Sources say.
- suggestions: three different questions (max 90 characters each) that the Sources can answer.

Sources:
`;

// Shares the budget evenly across Sources. Long texts are cut (the tail is dropped), which is fine
// for a summary: the opening of a document usually carries its topic.
export function buildGuideSources(sources: { title: string; text: string }[], budget = GUIDE_CHAR_BUDGET): string {
  const each = Math.floor(budget / Math.max(sources.length, 1));
  return sources.map((s, i) => `### Source ${i + 1}: ${s.title}\n${s.text.slice(0, each)}`).join("\n\n");
}

// Defensive: the model may wrap the object in prose or code fences. Returns null on anything unexpected.
export function parseGuideOutput(text: string): Pick<Guide, "emoji" | "title" | "summary" | "suggestions"> | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const obj: unknown = JSON.parse(match[0]);
    if (typeof obj !== "object" || obj === null) return null;
    const { emoji, title, summary, suggestions } = obj as Record<string, unknown>;
    if (typeof title !== "string" || typeof summary !== "string" || !Array.isArray(suggestions)) return null;
    const qs = suggestions
      .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
      .map((s) => s.trim().slice(0, 90));
    if (!title.trim() || !summary.trim() || qs.length < 3) return null;
    // The emoji is decoration: anything that is not a short run of non-letters is dropped, not an error.
    const mark = typeof emoji === "string" && /^[^\p{L}\p{N}\s]{1,12}$/u.test(emoji.trim()) ? emoji.trim() : undefined;
    return { emoji: mark, title: title.trim().slice(0, 100), summary: summary.trim().slice(0, 2000), suggestions: qs.slice(0, 3) };
  } catch {
    return null;
  }
}

// Same set of ids, in any order.
export function sameIds(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  return set.size === a.length && b.every((id) => set.has(id));
}
