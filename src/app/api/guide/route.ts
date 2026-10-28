import { SUGGESTION_MODEL } from "@/config/models";
import { openRouterModel } from "@/lib/chat/graph";
import { buildGuideSources, GUIDE_PROMPT, parseGuideOutput, sameIds, type Guide } from "@/lib/guide";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60; // one non-streaming model call over up to ~60k characters

const json = (body: unknown, status = 200) => Response.json(body, { status });

// Body: {} or {"force": true}. Returns {"guide": Guide | null} or {"error": string}.
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const force = body?.force === true;

  let supabase;
  try {
    supabase = await createClient();
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Server is misconfigured." }, 500);
  }
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return json({ error: "Not signed in." }, 401);

  const { data: notebook } = await supabase.from("notebooks").select("id, guide").maybeSingle();
  if (!notebook) return json({ error: "Notebook not found." }, 404);

  const { data: rows, error: sourcesError } = await supabase
    .from("sources")
    .select("id, title, extracted_text")
    .eq("notebook_id", notebook.id)
    .eq("status", "ready")
    .order("id");
  if (sourcesError) return json({ error: "Could not load Sources." }, 500);

  const save = async (guide: Guide | null) => {
    const { error } = await supabase.from("notebooks").update({ guide }).eq("id", notebook.id);
    return error;
  };

  if (!rows || rows.length === 0) {
    if (notebook.guide && (await save(null))) return json({ error: "Could not save the guide." }, 500);
    return json({ guide: null });
  }

  const sourceIds = rows.map((r) => r.id as string).sort();
  const stored = notebook.guide as Guide | null;
  if (!force && stored && sameIds(stored.sourceIds ?? [], sourceIds)) return json({ guide: stored });

  let parsed;
  try {
    const sources = rows.map((r) => ({ title: (r.title as string) ?? "Untitled", text: (r.extracted_text as string) ?? "" }));
    const res = await openRouterModel(SUGGESTION_MODEL, false).invoke([
      { role: "system", content: GUIDE_PROMPT + buildGuideSources(sources) },
      { role: "user", content: "Write the guide now." },
    ]);
    parsed = parseGuideOutput(typeof res.content === "string" ? res.content : "");
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Guide generation failed." }, 502);
  }
  if (!parsed) return json({ error: "The model returned an unusable guide. Try again." }, 502);

  const guide: Guide = { ...parsed, sourceIds, createdAt: new Date().toISOString() };
  if (await save(guide)) return json({ error: "Could not save the guide." }, 500);
  return json({ guide });
}
