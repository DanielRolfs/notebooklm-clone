import type { SupabaseClient } from "@supabase/supabase-js";
import { embedTexts } from "@/lib/openrouter/embeddings";
import { chunkText } from "./chunk";

const EMBED_BATCH = 64;
const INSERT_BATCH = 200;

export type IngestInput = {
  supabase: SupabaseClient;
  notebookId: string;
  type: "file" | "website" | "youtube" | "text";
  title: string;
  text: string;
};

// Shared by every Source type. Returns the new Source id; on failure the Source is
// marked failed and none of its Chunks are kept.
export async function ingestText({ supabase, notebookId, type, title, text }: IngestInput): Promise<string> {
  const chunks = chunkText(text);
  if (chunks.length === 0) throw new Error("No text found in this Source.");

  const { data: source, error } = await supabase
    .from("sources")
    .insert({ notebook_id: notebookId, type, title, extracted_text: text, status: "processing" })
    .select("id")
    .single();
  if (error) throw new Error(`Could not create Source: ${error.message}`);

  try {
    // Embed everything first, so a failed embedding never leaves partial Chunks.
    const vectors: number[][] = [];
    for (let i = 0; i < chunks.length; i += EMBED_BATCH) {
      const batch = chunks.slice(i, i + EMBED_BATCH);
      vectors.push(...(await embedTexts(batch.map((c) => c.content))));
    }
    const rows = chunks.map((c, i) => ({
      source_id: source.id,
      notebook_id: notebookId,
      position: c.position,
      content: c.content,
      embedding: JSON.stringify(vectors[i]), // pgvector accepts the "[1,2,3]" text form
    }));
    for (let i = 0; i < rows.length; i += INSERT_BATCH) {
      const { error: insertError } = await supabase.from("chunks").insert(rows.slice(i, i + INSERT_BATCH));
      if (insertError) throw new Error(insertError.message);
    }
    const { error: readyError } = await supabase.from("sources").update({ status: "ready" }).eq("id", source.id);
    if (readyError) throw new Error(readyError.message);
    return source.id;
  } catch (e) {
    await supabase.from("chunks").delete().eq("source_id", source.id);
    await supabase.from("sources").update({ status: "failed" }).eq("id", source.id);
    throw e;
  }
}
