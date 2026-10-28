import { SUGGESTION_MODEL } from "@/config/models";
import { openRouterModel } from "./graph";
import { parseSuggestions, SUGGESTION_PROMPT, type RetrievedChunk } from "./prompt";

// Runs after the graph so the answer stream is untouched. Never throws: suggestions are optional.
export async function suggestFollowUps(question: string, answer: string, chunks: RetrievedChunk[]) {
  if (chunks.length === 0) return [];
  try {
    const excerpts = chunks.map((c) => `[${c.n}] ${c.content}`).join("\n\n");
    const res = await openRouterModel(SUGGESTION_MODEL, false).invoke([
      { role: "system", content: SUGGESTION_PROMPT + excerpts },
      { role: "user", content: `Question: ${question}\n\nAnswer: ${answer}` },
    ]);
    return parseSuggestions(typeof res.content === "string" ? res.content : "");
  } catch {
    return [];
  }
}
