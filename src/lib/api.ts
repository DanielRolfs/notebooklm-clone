// The HTTP contracts with the ingestion and chat servers live here, nowhere else.

export type Citation = { n: number; sourceId: string; sourceTitle: string; snippet: string };

async function errorMessage(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (body?.error) return String(body.error);
  } catch {}
  return `Request failed (${res.status})`;
}

/** Contract: POST /api/sources. Multipart `file`, or JSON `{type:"text",title,text}`. */
export async function addSource(
  input: { file: File } | { title: string; text: string },
): Promise<string> {
  let init: RequestInit;
  if ("file" in input) {
    const form = new FormData();
    form.append("file", input.file);
    init = { method: "POST", body: form };
  } else {
    init = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "text", title: input.title, text: input.text }),
    };
  }
  const res = await fetch("/api/sources", init);
  if (!res.ok) throw new Error(await errorMessage(res));
  return (await res.json()).id as string;
}

/**
 * Contract: POST /api/chat. Newline-delimited JSON:
 * {type:"text",delta} lines, then {type:"citations",items}, then optionally
 * {type:"suggestions",items:[string,string,string]}; or {type:"error",message} at any point.
 */
export async function streamChat(
  question: string,
  sourceIds: string[],
  on: {
    text: (delta: string) => void;
    citations: (items: Citation[]) => void;
    suggestions?: (items: string[]) => void; // optional line: no line means no cards
  },
): Promise<void> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, sourceIds }),
  });
  if (!res.ok || !res.body) throw new Error(await errorMessage(res));

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  const handle = (line: string) => {
    if (!line.trim()) return;
    const msg = JSON.parse(line);
    if (msg.type === "text") on.text(msg.delta);
    else if (msg.type === "citations") on.citations(msg.items);
    else if (msg.type === "suggestions") on.suggestions?.(msg.items);
    else if (msg.type === "error") throw new Error(msg.message);
  };
  // A network chunk can end mid-line, so keep the unfinished tail in the buffer.
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += value;
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    lines.forEach(handle);
  }
  handle(buffer);
}
