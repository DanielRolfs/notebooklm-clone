import { EMBEDDING_DIMENSIONS, EMBEDDING_MODEL } from "@/config/models";
import { requireEnv } from "@/lib/env";

// Shared by ingestion (embed chunks) and chat (embed the question).
// Plain fetch: OpenRouter's embeddings endpoint is OpenAI-compatible, no SDK needed.
export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const res = await fetch("https://openrouter.ai/api/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${requireEnv("OPENROUTER_API_KEY", process.env.OPENROUTER_API_KEY)}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: texts }),
  });
  if (!res.ok) throw new Error(`OpenRouter embeddings failed: ${res.status} ${await res.text()}`);
  const json = (await res.json()) as { data: { index: number; embedding: number[] }[] };
  const vectors = [...json.data].sort((a, b) => a.index - b.index).map((d) => d.embedding);
  if (vectors.some((v) => v.length !== EMBEDDING_DIMENSIONS)) {
    throw new Error(`Embedding size is not ${EMBEDDING_DIMENSIONS}; check EMBEDDING_MODEL.`);
  }
  return vectors;
}
