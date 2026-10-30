# NotebookLM Clone

A small clone of [Google NotebookLM](https://notebooklm.google.com). You sign in with Google, add **Sources** (files or pasted text), write **Notes**, and chat with an AI that answers from your Sources and cites them.

- **Live demo:** https://notebooklm-clone-danielrolfs-projects.vercel.app
- **How it works under the hood:** [TECHNICAL.md](TECHNICAL.md) (with links into the code and the reasons behind each decision)
- **Plan and scope:** [initialAnalysis.md](initialAnalysis.md) (my first analysis) and [llmImprovedAnalysis.md](llmImprovedAnalysis.md) (the improved version)

Stack: Next.js 16 (App Router, TypeScript, Tailwind), Supabase (Google login, Postgres, pgvector), OpenRouter (Claude for chat, OpenAI embeddings), LangGraph, Vercel.

## What to try (two minutes)

1. Open the live demo and click **Sign in**. Google opens straight away.
2. **Add sources:** upload a PDF, `.md` or `.txt` file, or paste text. Wait until it shows *ready*.
3. The notebook gets a **title, a summary and three question cards**. Click a card.
4. **Chat:** answers stream in with `[1]`-style citations. Hover one to see the Source and the passage.
5. **Create note:** the editor opens in the right panel. It autosaves. Fold the panel in and out with the icon in its corner.
6. Hover any grayed-out button: *"Not part of this clone's scope."*

## Scope

**Built**

- Google login (Supabase Auth), one Notebook per user
- Add sources: file upload (PDF, txt, md; drag and drop) and copied text; 50 Sources and 10 MB per file
- Retrieval-augmented chat with streamed answers, citations and follow-up questions
- Auto-generated notebook title, summary and question cards
- Notes: create, rename, remove, edit with autosave
- A public start page and a layout modelled on the original

**Left out on purpose** (shown grayed out with a tooltip): web search, websites and YouTube links, Google Drive, Play Books, audio and video overviews and the other Studio tools, saving an answer as a note, text styling and export in notes, sharing and settings.

## Time spent


| Step                                       | Time          |
| -------------------------------------------- | --------------- |
| 1. Test NotebookLM                         | 10 min        |
| 2. Identify key features                   | 30 min        |
| 3. Improve the initial analysis            | 5 min         |
| 4. Grill with Docs (Matt Pocock skill)     | 30 min        |
| 5. Build, review and deploy with AI agents | 2 h 30 min    |
| 6. Test and fix                            | 1 h 15 min    |
| 7. Review Readme & Final tests             | 30 min        |
| **Total**                                  | **about 5 h** |

Step 5 is wall-clock time from the first commit of the build (15:19) to the last feature merge (about 17:20) plus writing these docs. A manager session handed out the work, subagents built the branches in parallel, and I tested every pull request on its Vercel preview before it was merged: 15 pull requests (this documentation one included), 14 merged and one closed (website and YouTube import).

Step 6 is wall-clock time from the README update that added step 5 (17:28) to the end of the match-the-screenshots pass (about 18:45). It covers the UI parity and font fixes, the responsive panels, the Playwright tests (logged-out, signed-in and layout) and a click-through of the whole app against the six screenshots. That pass added the missing controls, for example the title, search box, Play Books and Drive chips in the Add sources popover, the grayed-out Export to Docs item, the Drive hint above the chat box, and the emoji above the guide title.

## Setup

1. Install dependencies: `npm install`
2. Create a Supabase project.
3. In Supabase, enable Google under Authentication, Providers. Add `http://localhost:3000/auth/callback` (and your deployed address) to the redirect URLs.
4. Copy the env template and fill it in: `cp .env.example .env.local`
5. Apply the database migrations (below).

### Environment variables

`.env.local` stays on your machine and is git-ignored. `.env.example` is the template and lists where to find each value.


| Variable                               | Where to get it                                              | Secret           |
| ---------------------------------------- | -------------------------------------------------------------- | ------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`             | Supabase: Project Settings, API                              | No               |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase: Project Settings, API Keys (publishable / anon)    | No               |
| `SUPABASE_SERVICE_ROLE_KEY`            | Supabase: Project Settings, API Keys (secret / service_role) | Yes, server only |
| `OPENROUTER_API_KEY`                   | openrouter.ai, Keys (add a few dollars of credit)            | Yes, server only |

Google login also needs an OAuth client from Google Cloud Console. Use the callback URL shown under Supabase, Authentication, Providers, Google, then paste the client ID and secret there.

### Migrations

SQL lives in [supabase/migrations/](supabase/migrations/). Apply both files, in order. With the Supabase CLI:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

Or paste each file into the Supabase SQL editor. The first enables `vector`, creates `notebooks`, `sources`, `chunks` and `notes` with Row Level Security, creates a Notebook for each new user, and adds `match_chunks` for cosine search. The second adds the `guide` column to `notebooks`.

## Run

```bash
npm run dev      # http://localhost:3000
npm test         # unit tests (Vitest)
npm run lint
npx tsc --noEmit
npm run build
```

Anonymous visitors on `/` are sent to the public start page at `/welcome`; every other page needs a login.

## End-to-end tests

`npm run test:e2e` drives the real app in Google Chrome with Playwright, including the signed-in screens: sources, guide, chat with citations, notes, panel folding and sign-out. Google login itself is not automated. Instead the setup uses the service role key to create a throwaway user (`e2e-...@example.test`) and mints a real Supabase session for it. The app has no test-only code. When the run ends, the user and everything it created are deleted.

- It needs `SUPABASE_SERVICE_ROLE_KEY` (plus the two public Supabase variables) from `.env.local`, so it runs on your machine, not in CI or on Vercel.
- A layout test opens the signed-in app at 900, 1100, 1280, 1440 and 1920 px wide and fails if anything sticks out of its container or the page scrolls sideways. `E2E_SHOTS_DIR=folder` also saves its screenshots.
- It uses the model: the guide and two chat questions, plus the embeddings. That costs a few cents of OpenRouter credit per run.
- Only the logged-out checks (start page, redirects, closed API routes), no keys needed: `npm run test:e2e:public`
- Against the deployed site instead of a local dev server: `E2E_BASE_URL=https://your-app.vercel.app npm run test:e2e` (the keys must belong to the same Supabase project as that site).
- The tests use the installed Google Chrome. Without it, run `npx playwright install chromium` and remove `channel: "chrome"` in [playwright.config.ts](playwright.config.ts).
- The HTML report lands in `playwright-report/` (open it with `npx playwright show-report`).

## Models

Model names are in [src/config/models.ts](src/config/models.ts). The embedding model must stay at 1536 dimensions to match the `chunks` table.

## More

- [GLOSSARY.md](GLOSSARY.md): the vocabulary (Notebook, Source, Chunk, Note, Citation, Chat)
- [docs/adr/](docs/adr/): architecture decisions
- [Screenshots/](Screenshots/): the reference screenshots of the original app
