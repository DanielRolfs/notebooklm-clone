# NotebookLM Clone: Analysis

**Task:** Clone [NotebookLM](https://notebooklm.google.com). Deliver a GitHub repo, a live deployment and a Loom video (max 10 min) with a live test.

**Stack:** Next.js on Vercel, Supabase (Postgres, pgvector, Auth), OpenRouter (Claude for chat, OpenAI embeddings), LangGraph

## Key features in scope


| # | Feature                 | Notes                                                                                                                             | Screenshot                                                                                           |
| --- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| 1 | Google account login    | Entry point of the app                                                                                                            | [Start page](<Screenshots/1. New Startpage.png>), [After login](<Screenshots/2. After Login Screen.png>) |
| 2 | Add resources           | Keep: file upload (drag & drop), copied text. Remove: Play Books, Drive, web search, website and YouTube links (out of scope, see Decisions)                       | [Add resources](<Screenshots/3. Add Resources Popover.png>)                                          |
| 3 | Create a note           | Button creates a "Notes" folder plus a new note on first use. The note opens on the right. Remove: text styling, "Export to Docs" | [Note view](<Screenshots/4. Create Note View.png>)                                                   |
| 4 | Note actions            | Add: 3-dot menu on the left with "Remove note" and "Rename note", and a "Remove" button inside the note                           | [Note menu](<Screenshots/5. Edit Note Popover.png>)                                                  |
| 5 | LLM answer after upload | Auto summary of the uploaded sources, then chat over them                                                                         | [LLM answer](<Screenshots/6. Initial LLM Answer after File Upload.png>)                              |

## Out of scope

Every other feature shows a grayed-out icon with the tooltip: *"Not part of this clone's scope."*

## Decisions

- **Login:** Supabase Auth with Google. One Notebook per user, no list page.
- **Sources:** PDF, text and Markdown files (max 10 MB, 50 per Notebook) and pasted text. Only extracted text is stored.
- **Websites and YouTube links: out of scope.** They were built (branch `feat/web-youtube-sources`, PR #14 closed) but dropped: fetching arbitrary URLs on the server needs a strong SSRF guard, and YouTube often blocks server addresses, so it would be fragile in a demo. The chip is shown grayed out.
- **RAG:** Chunks of ~800 tokens, 100 overlap, in pgvector. Top 8 by cosine similarity from the ticked Sources. No hybrid search or reranking.
- **Chat:** Small LangGraph (retrieve, then answer), streamed. Numbered citations [1], [2] with source name and snippet on hover.
- **Models:** One OpenRouter key. Claude for chat, `openai/text-embedding-3-small` for embeddings. Model names live in one config file.
- **Notes:** Written by the user. Saving a chat answer as a note is grayed out.
- **Auto summary (notebook guide):** One model call over the ready Sources (not part of the graph). Title, summary and three question cards are stored in `notebooks.guide` and reused while the set of Sources is unchanged.
- **Tests:** Unit tests for chunking, file extraction and the guide helpers (13, Vitest). End-to-end tests with Playwright cover the public and the signed-in screens (run locally, see the README).
- See [ADR 0001](docs/adr/0001-rag-with-pgvector-via-openrouter.md) and [TECHNICAL.md](TECHNICAL.md).

## Working rules

- Short planning docs.
- Micro-commits on topic branches.
- Enterprise-ready, but no needless complexity. Justify each bit of complexity.

## Workflow

- The main Claude session is the **manager**. It hands out one branch at a time for review.
- **Subagents** build the branches in the background, each in its own git worktree.
- Foundation branch first (scaffold, Supabase schema, login). After it merges, independent branches run in parallel.
- Each finished branch becomes a pull request with a Vercel preview and a two-line "how to test" note.
- Daniel tests the PR and says "merge". Only the manager merges, and only on that word. Then it hands over the next PR.
- After every merge, the remaining branches rebase onto main.
