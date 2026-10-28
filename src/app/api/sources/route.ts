import { NextResponse } from "next/server";
import { MAX_FILE_BYTES, UnsupportedFileError, extractFileText } from "@/lib/ingest/extract";
import { EmptyPageError, extractWebText } from "@/lib/ingest/extract-web";
import { YoutubeError, fetchYoutube, parseYoutubeId } from "@/lib/ingest/extract-youtube";
import { ingestText } from "@/lib/ingest/ingest-text";
import { UnsafeUrlError, parseWebUrl, safeFetchText } from "@/lib/ingest/safe-fetch";
import { createClient } from "@/lib/supabase/server";

const MAX_SOURCES = 50;

// Ingestion runs inside the request, so very large files can hit this limit (Vercel Hobby caps at 60s).
export const maxDuration = 60;

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return fail("Not signed in.", 401);

  const { data: notebook } = await supabase.from("notebooks").select("id").maybeSingle();
  if (!notebook) return fail("Notebook not found.", 404);

  const { count } = await supabase
    .from("sources")
    .select("id", { count: "exact", head: true })
    .eq("notebook_id", notebook.id);
  if ((count ?? 0) >= MAX_SOURCES) return fail(`A Notebook holds at most ${MAX_SOURCES} Sources.`, 409);

  let type: "file" | "text" | "website" | "youtube";
  let title: string;
  let text: string;
  try {
    if (request.headers.get("content-type")?.includes("multipart/form-data")) {
      const file = (await request.formData()).get("file");
      if (!(file instanceof File)) return fail("Missing file.", 400);
      if (file.size > MAX_FILE_BYTES) return fail("File is larger than 10 MB.", 413);
      type = "file";
      title = file.name;
      text = await extractFileText(file.name, new Uint8Array(await file.arrayBuffer()));
    } else {
      const body = await request.json();
      if (body?.type === "website") {
        if (typeof body.url !== "string") return fail('Expected {"type":"website","url"}.', 400);
        const url = parseWebUrl(body.url);
        const videoId = parseYoutubeId(url);
        if (videoId) {
          type = "youtube";
          ({ title, text } = await fetchYoutube(videoId));
        } else {
          type = "website";
          const page = await safeFetchText(url.href);
          ({ title, text } = extractWebText(page.body, url.hostname));
        }
      } else {
        if (body?.type !== "text" || typeof body.text !== "string" || !body.text.trim()) {
          return fail('Expected {"type":"text","title","text"}, {"type":"website","url"} or a multipart file.', 400);
        }
        type = "text";
        title = typeof body.title === "string" && body.title.trim() ? body.title.trim() : "Pasted text";
        text = body.text;
      }
    }
  } catch (e) {
    if (e instanceof UnsupportedFileError) return fail(e.message, 415);
    if (e instanceof UnsafeUrlError) return fail(e.message, 400);
    if (e instanceof EmptyPageError || e instanceof YoutubeError) return fail(e.message, 422);
    return fail("Could not read the request or file.", 400);
  }

  try {
    const id = await ingestText({ supabase, notebookId: notebook.id, type, title, text });
    return NextResponse.json({ id });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Ingestion failed.", 500);
  }
}
