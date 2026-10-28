import { chatGraph } from "@/lib/chat/graph";
import { citedNumbers, type RetrievedChunk } from "@/lib/chat/prompt";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60; // retrieval + a streamed Claude answer; Vercel's default is too tight

const MAX_SOURCES = 50;
const SNIPPET_LENGTH = 240;

const json = (body: unknown, status: number) => Response.json(body, { status });

// Stream format: one JSON object per line. See the UI branch for the consumer.
// {"type":"text","delta":string} | {"type":"citations","items":[...]} | {"type":"error","message":string}
export async function POST(request: Request) {
  let body: { question?: unknown; sourceIds?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Body must be JSON." }, 400);
  }
  const question = typeof body.question === "string" ? body.question.trim() : "";
  const sourceIds = Array.isArray(body.sourceIds) ? body.sourceIds : [];
  if (!question) return json({ error: "Question must not be empty." }, 400);
  if (
    sourceIds.length === 0 ||
    sourceIds.length > MAX_SOURCES ||
    !sourceIds.every((id) => typeof id === "string")
  ) {
    return json({ error: "Select at least one Source." }, 400);
  }

  let supabase;
  try {
    supabase = await createClient();
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Server is misconfigured." }, 500);
  }
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return json({ error: "Not signed in." }, 401);

  // RLS already hides other users' rows; this explicit check gives a clear 400 instead of silent emptiness.
  const { data: notebook } = await supabase.from("notebooks").select("id").maybeSingle();
  if (!notebook) return json({ error: "Notebook not found." }, 404);
  const ids = [...new Set(sourceIds as string[])];
  const { data: sources, error: sourcesError } = await supabase
    .from("sources")
    .select("id, title")
    .eq("notebook_id", notebook.id)
    .in("id", ids);
  if (sourcesError) return json({ error: "Could not load Sources." }, 500);
  if (sources.length !== ids.length) return json({ error: "Unknown Source in sourceIds." }, 400);
  const titles = new Map(sources.map((s) => [s.id as string, s.title as string]));

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) => controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
      try {
        const events = await chatGraph.stream(
          { question, sourceIds: ids },
          {
            configurable: { supabase, notebookId: notebook.id },
            streamMode: ["messages", "values"],
            signal: request.signal,
          },
        );
        let streamed = false;
        let final: { chunks?: RetrievedChunk[]; answer?: string } = {};
        for await (const [mode, data] of events) {
          if (mode === "messages") {
            const [msg, meta] = data;
            const delta = typeof msg.content === "string" ? msg.content : "";
            if (meta?.langgraph_node === "generate" && delta) {
              streamed = true;
              send({ type: "text", delta });
            }
          } else if (mode === "values") {
            final = data;
          }
        }
        // The no-Chunks reply is not produced by the model, so it never streams as tokens.
        if (!streamed && final.answer) send({ type: "text", delta: final.answer });

        const cited = citedNumbers(final.answer ?? "");
        const items = (final.chunks ?? [])
          .filter((c) => cited.has(c.n))
          .map((c) => ({
            n: c.n,
            sourceId: c.sourceId,
            sourceTitle: titles.get(c.sourceId) ?? "Unknown Source",
            snippet: c.content.slice(0, SNIPPET_LENGTH),
          }));
        send({ type: "citations", items });
      } catch (e) {
        send({ type: "error", message: e instanceof Error ? e.message : "Chat failed." });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
  });
}
