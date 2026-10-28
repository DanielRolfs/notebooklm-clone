import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import type { RunnableConfig } from "@langchain/core/runnables";
import type { SupabaseClient } from "@supabase/supabase-js";
import { CHAT_MODEL } from "@/config/models";
import { requireEnv } from "@/lib/env";
import { embedTexts } from "@/lib/openrouter/embeddings";
import { buildSystemPrompt, type RetrievedChunk } from "./prompt";

const TOP_K = 8;
// A little freedom, so the model can apply the Sources to the user's case. The other model calls stay at 0.
const ANSWER_TEMPERATURE = 0.4;

const State = Annotation.Root({
  question: Annotation<string>(),
  sourceIds: Annotation<string[]>(),
  chunks: Annotation<RetrievedChunk[]>(),
  answer: Annotation<string>(),
});

// Per-request objects travel in config, so the compiled graph stays a module constant.
type Ctx = { supabase: SupabaseClient; notebookId: string };
const ctx = (config?: RunnableConfig) => config?.configurable as Ctx;

async function retrieve(state: typeof State.State, config?: RunnableConfig) {
  const { supabase, notebookId } = ctx(config);
  const [embedding] = await embedTexts([state.question]);
  const { data, error } = await supabase.rpc("match_chunks", {
    query_embedding: embedding,
    p_notebook_id: notebookId,
    source_ids: state.sourceIds,
    match_count: TOP_K,
  });
  if (error) throw new Error(`Retrieval failed: ${error.message}`);
  const rows = (data ?? []) as { source_id: string; content: string }[];
  return { chunks: rows.map((r, i) => ({ n: i + 1, sourceId: r.source_id, content: r.content })) };
}

// streaming: true makes LangGraph's "messages" stream mode emit tokens.
export function openRouterModel(model: string, streaming: boolean, temperature = 0) {
  return new ChatOpenAI({
    model,
    apiKey: requireEnv("OPENROUTER_API_KEY", process.env.OPENROUTER_API_KEY),
    configuration: { baseURL: "https://openrouter.ai/api/v1" },
    streaming,
    temperature,
  });
}

async function generate(state: typeof State.State) {
  // No Chunks: skip the model call, it could only guess.
  if (state.chunks.length === 0) {
    return { answer: "I do not know. The selected Sources have no passages that match your question." };
  }
  const res = await openRouterModel(CHAT_MODEL, true, ANSWER_TEMPERATURE).invoke([
    { role: "system", content: buildSystemPrompt(state.chunks) },
    { role: "user", content: state.question },
  ]);
  return { answer: typeof res.content === "string" ? res.content : "" };
}

export const chatGraph = new StateGraph(State)
  .addNode("retrieve", retrieve)
  .addNode("generate", generate)
  .addEdge(START, "retrieve")
  .addEdge("retrieve", "generate")
  .addEdge("generate", END)
  .compile();
