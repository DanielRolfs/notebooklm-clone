# How it works under the hood

A short tour of the code for a reviewer, or for me in six months. Every section links to the code it talks about (line numbers are from the commit that added this file). Vocabulary is in [GLOSSARY.md](GLOSSARY.md): **Notebook**, **Source**, **Chunk**, **Note**, **Citation**, **Chat**.

## The big picture

```
Browser (Next.js client components)
   │  add source            ask a question           notebook opens
   ▼                        ▼                        ▼
POST /api/sources      POST /api/chat           POST /api/guide
   │                        │                        │
   ▼                        ▼                        ▼
extract → chunk →      LangGraph: retrieve →    one model call over the
embed → store          generate (streamed)      sources → title, summary,
   │                        │                   3 question cards
   ▼                        ▼                        ▼
┌───────────────────── Supabase (Postgres + pgvector + Auth) ─────────────────────┐
│ notebooks · sources · chunks (vector 1536) · notes     Row Level Security on all │
└──────────────────────────────────────────────────────────────────────────────────┘
          embeddings + chat models: OpenRouter (one API key)
```

- **Frontend:** Next.js 16 (App Router), React 19, Tailwind. Pages are server components that read from Supabase; the interactive parts are a few client components.
- **Backend:** three route handlers (`/api/sources`, `/api/chat`, `/api/guide`) plus the two login routes. No separate server.
- **Database and login:** Supabase (Postgres with pgvector, Google login).
- **AI:** OpenRouter, so one key serves both the chat model and the embedding model. The model names live in [src/config/models.ts](src/config/models.ts).
- **Hosting:** Vercel, with [vercel.json](vercel.json) pinning the Next.js preset.

## 1. Login and access control

1. The start page buttons link to [`/auth/google`](src/app/auth/google/route.ts#L5-L15). It starts the Google sign-in **on the server**, so the PKCE cookie is set before the redirect, and sends the visitor straight to Google.
2. Google returns to [`/auth/callback`](src/app/auth/callback/route.ts), which swaps the code for a session cookie and redirects to `/`.
3. [src/proxy.ts](src/proxy.ts) (Next.js 16's name for middleware) runs on every request through [updateSession](src/lib/supabase/proxy.ts#L26-L36): it validates the session with `getClaims()` and sends anonymous visitors to `/welcome` (root) or `/login` (everything else). `/welcome`, `/login` and `/auth/*` are public.
4. Data access is protected a second time in the database: [Row Level Security policies](supabase/migrations/20261028150000_init.sql#L69-L89) only allow a user to touch rows in their own Notebook. Even a bug in a route handler cannot leak another user's data.

**Why this way:** the session is checked at the edge (cheap) and again by the database (safe). The server-side login route replaced a "click again" login page the first version had.

## 2. Data model

Defined in [the first migration](supabase/migrations/20261028150000_init.sql):

| Table | Holds | Notes |
| --- | --- | --- |
| `notebooks` | one row per user | `user_id` is unique; a [trigger](supabase/migrations/20261028150000_init.sql#L47-L61) creates it at first sign-in. A later [migration](supabase/migrations/20261028160000_notebook_guide.sql) adds the `guide` JSON column. |
| `sources` | uploaded file or pasted text | stores the **extracted text**, not the original file; `status` is `pending`, `processing`, `ready` or `failed` |
| `chunks` | passages of a source | `embedding vector(1536)` with an [HNSW index](supabase/migrations/20261028150000_init.sql#L34) for cosine search; `notebook_id` is copied onto each chunk so security and search need no join |
| `notes` | the user's notes | plain text, title plus content |

The search itself is a SQL function, [match_chunks](supabase/migrations/20261028150000_init.sql#L91-L109): cosine similarity, limited to the given Notebook and the ticked Sources. It runs with the caller's rights, so RLS still applies.

## 3. Adding a Source (ingestion)

[POST /api/sources](src/app/api/sources/route.ts#L13-L58) accepts a file upload (PDF, `.txt`, `.md`) or pasted text. In order it:

1. checks the login and finds the user's Notebook,
2. enforces the limits: [50 Sources per Notebook, 10 MB per file](src/app/api/sources/route.ts#L6) and clear status codes (401, 404, 409, 413, 415),
3. [extracts the text](src/lib/ingest/extract.ts#L8-L17) (PDFs with `unpdf`),
4. hands it to [ingestText](src/lib/ingest/ingest-text.ts#L18-L55), which
   - [splits it into Chunks](src/lib/ingest/chunk.ts#L20-L33): about 800 tokens each with 100 tokens of overlap, cut at a paragraph, then a sentence, then a space (tokens are estimated as characters ÷ 4, so no tokenizer library is needed),
   - [embeds them](src/lib/openrouter/embeddings.ts) in batches of 64 through OpenRouter (`openai/text-embedding-3-small`, 1536 numbers per Chunk),
   - stores the Chunks and marks the Source `ready`. If anything fails, the Chunks are deleted and the Source is marked `failed`, so there are never half-written Sources.

The UI shows the progress: the Sources list [re-reads the page every 3 seconds](src/components/SourcesPanel.tsx#L91-L94) while any Source is still `pending` or `processing`.

## 4. Asking a question (retrieval and answer)

[POST /api/chat](src/app/api/chat/route.ts#L15-L52) validates the request (non-empty question, 1 to 50 Source ids, all belonging to the user) and then runs a small **LangGraph** with two nodes ([graph.ts](src/lib/chat/graph.ts#L60-L66)):

1. **retrieve** ([code](src/lib/chat/graph.ts#L23-L35)): embeds the question and calls `match_chunks` for the **top 8** Chunks of the ticked Sources.
2. **generate** ([code](src/lib/chat/graph.ts#L48-L58)): sends the numbered Chunks and the question to Claude. If no Chunk matched, it answers "I do not know" without calling the model, because it could only guess.

The [prompt](src/lib/chat/prompt.ts#L7-L19) numbers the Chunks `[1]`, `[2]`, … and tells the model to answer only from them and to cite the numbers.

**Streaming.** The route [streams](src/app/api/chat/route.ts#L56-L105) one JSON object per line (NDJSON): text pieces as they arrive, then the Citations (only the numbers the answer actually used, with Source title and a snippet), then three follow-up questions from a [second small model call](src/lib/chat/suggest.ts#L6-L18), or an error line. The browser reads it with [streamChat](src/lib/api.ts#L40) and shows the Citations on hover in the [ChatPanel](src/components/ChatPanel.tsx#L23-L40).

## 5. The notebook guide (title, summary, question cards)

Like the real app, the notebook shows a title, a summary and three clickable questions once Sources are ready.

- [POST /api/guide](src/app/api/guide/route.ts#L11-L65) reads the text of all `ready` Sources, [splits a 60,000-character budget evenly](src/lib/guide.ts#L11-L31) across them, makes **one** non-streaming model call and stores the result in `notebooks.guide` together with the ids of the Sources it used.
- If the set of ready Sources has not changed, the stored guide is [returned without calling the model](src/app/api/guide/route.ts#L47). Reloading the page costs nothing.
- The [ChatPanel](src/components/ChatPanel.tsx#L60-L90) triggers it automatically when the set of ready Sources changes. An "in flight" flag prevents duplicate calls, and a failure shows a "Try again" button instead of retrying forever. After success the page refreshes, so the header title updates too ([page.tsx](src/app/page.tsx#L12-L22)).

## 6. The interface

- [Workspace.tsx](src/components/Workspace.tsx) owns the shared state: which Sources are ticked ([L25-L31](src/components/Workspace.tsx#L25-L31)) and whether the right panel is folded in. The [column widths](src/components/Workspace.tsx#L83-L88) follow the reference (about a quarter of the width each, wider while a note is open).
- [SourcesPanel.tsx](src/components/SourcesPanel.tsx): list, ticking, the Add sources dialog, drag and drop.
- [StudioPanel.tsx](src/components/StudioPanel.tsx): the Studio tiles and the note editor. Notes [autosave](src/components/StudioPanel.tsx#L100-L110) 800 ms after typing stops and when you leave the field. The formatting toolbar is deliberately visible but inactive.
- [Tooltip.tsx](src/components/Tooltip.tsx): every feature that is not part of this clone is rendered **grayed out with the tooltip "Not part of this clone's scope"**.
- The public [start page](src/app/welcome/page.tsx) with its [SVG diagram](src/app/welcome/flow-diagram.tsx) is static; the diagram scales with the window width in [globals.css](src/app/globals.css).

## Decisions and why

| Decision | Why | Alternative I rejected |
| --- | --- | --- |
| **RAG with pgvector**, not "send everything to Claude" ([ADR 0001](docs/adr/0001-rag-with-pgvector-via-openrouter.md)) | The company uses Supabase, and a real retrieval pipeline shows how it works. | Full-context answers would be simpler at this size. |
| **One OpenRouter key** for chat and embeddings | Anthropic has no embedding model; one key means one place to configure. | Anthropic plus a second provider. |
| **Small LangGraph**, two nodes | Retrieval and generation are separate steps that can grow (rerank, tools). | A plain function would do today. |
| **NDJSON over `fetch`** for streaming | Simple, works with `POST`, no extra library. | Server-sent events (GET only), WebSockets. |
| **Prompt-based citations** | OpenRouter has no native citations feature. | Provider citation APIs. |
| **Store extracted text, not the file** | Chat only needs text; no file storage to secure. | Supabase Storage. |
| **Ingestion inside the request** (60 s limit) | No queue or worker to run; fine for the size limits. | Background job queue. |
| **Chunk size by characters ÷ 4** | No tokenizer dependency. | Exact token counting. |
| **Plain vector search**, top 8 | Good enough; easy to explain. | Hybrid search, reranking. |
| **Guide cached by Source ids** | Cheap: a model call only when the Sources really change. | Regenerate on every load. |
| **Row Level Security** | The database enforces ownership even if a route has a bug. | Checking `user_id` in every query. |
| **One Notebook per user** | The task is about Sources, Notes and Chat, not a Notebook list. | A Notebook list page. |
| **Websites and YouTube links left out** | Server-side fetching needs a strong SSRF guard, and YouTube often blocks server addresses, so it would be fragile in a demo. The branch `feat/web-youtube-sources` (closed PR #14) is kept. | Shipping it half-working. |

## Known limits

- Very large files can hit the 60 s serverless limit during ingestion.
- Chat history lives in the browser only; reloading clears it (Notes and the guide are saved).
- No rate limiting or cost quota per user; the 50-Source and 10 MB limits are the only guards.
- The summary is built from the first part of long Sources (the 60,000-character budget).
- Scanned PDFs without a text layer produce no text (there is no OCR).

## Tests

`npm test` runs 13 unit tests with Vitest: [chunking](src/lib/ingest/chunk.test.ts), [file extraction](src/lib/ingest/extract.test.ts) and the [guide helpers](src/lib/guide.test.ts). There is no end-to-end test yet.

## How it was built

A manager session handed out one branch at a time; subagents built them in parallel in separate git worktrees; each branch became a pull request with a Vercel preview that I tested before merging. See [llmImprovedAnalysis.md](llmImprovedAnalysis.md) for the plan and [README.md](README.md) for the time spent.
