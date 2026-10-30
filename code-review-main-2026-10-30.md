## 🔍 Code Review — main (whole codebase, empty tree → HEAD c5eb725)
**2026-10-30 | Large | Next.js 16, React 19, TypeScript, Tailwind 4, Supabase (RLS + pgvector), LangGraph, OpenRouter**

**Diff:** 80 files, +3,809 lines (binary assets and package-lock.json excluded) | **Fallow:** not available (`node_modules/.bin/fallow` missing)

**Reviewer-Pipeline:** 3× code-explorer → code-reviewer, security-reviewer, architecture-reviewer, completeness-check, test-coverage-check, lockfile-check → 0× extended-reasoner (no Critical) → prd-reviewer (pending)

Not run: schema-form-consistency-check and cross-reference-check (no forms, DTOs, controllers or services in the diff). No ARCHITECTURE.md exists; architecture was inferred from the code, TECHNICAL.md and GLOSSARY.md.

---

### 🔴 Critical (PR-specific)

None.

### 🟡 Warnings

Findings reported by several reviewers are merged into one entry.

**1. The 50-source cap is not enforced where the data lives**
- **File:** `src/app/api/sources/route.ts:21`
- **Reviewers:** code-reviewer, security-reviewer, architecture-reviewer
- **Issue:** The cap is a count-then-insert in one route. Parallel POSTs all read 49 and all insert. A signed-in user can also write straight to PostgREST `/rest/v1/sources` with the anon key, because the RLS policy is `for all`. Failed or stuck rows also count toward the cap.
- **Fix:** Add a `before insert` trigger on `public.sources` that takes `pg_advisory_xact_lock(hashtext(new.notebook_id::text))`, counts rows and raises at 50. Narrow the policies on `sources` and `chunks` to what the browser needs: `select` and `delete` only. Keep the route check for a friendly message.
- **Repro:** 20 concurrent `POST /api/sources` at 49 existing sources all succeed.

**2. No size or rate limits on paid endpoints**
- **File:** `src/app/api/sources/route.ts:39`
- **Reviewers:** security-reviewer, code-reviewer
- **Issue:** Pasted text, titles and chat `question` have no length cap (only file uploads have 10 MB). A PDF can expand to a huge amount of text. There is no per-user rate limit on `/api/chat`, `/api/guide` and `/api/sources`, so any Google account can burn OpenRouter credit. Non-UUID `sourceIds` cause Postgres error 22P02, which returns 500 instead of 400.
- **Fix:** Reject text over about 500,000 characters, titles over 200 and questions over about 4,000 with 413 or 400. Cap extracted PDF text. Validate `sourceIds` as UUIDs. Add a per-user rate limit before a public demo.

**3. Raw upstream errors are sent to the browser**
- **File:** `src/app/api/sources/route.ts:56`
- **Reviewers:** security-reviewer, code-reviewer
- **Related:** `src/app/api/chat/route.ts:98`, `src/app/api/guide/route.ts:58`, `src/lib/openrouter/embeddings.ts:16`
- **Issue:** OpenRouter response bodies, Postgres messages and "Missing environment variable …" text reach the client.
- **Fix:** Log with `console.error` and return generic messages. Keep `UnsupportedFileError` and the explicit 4xx messages.

**4. Expired session turns API calls into HTML responses**
- **File:** `src/lib/supabase/proxy.ts:29`
- **Reviewers:** code-reviewer, security-reviewer
- **Issue:** `/api/*` goes through the same redirect as pages, so an expired session gets a 307 to `/login`, then a 200 HTML page. `addSource`, `createGuide` and `streamChat` then fail with "Unexpected token '<'" instead of "Not signed in". `PUBLIC_PATHS` also uses an unanchored `startsWith`, so a future `/authors` or `/login-debug` would be public by accident.
- **Fix:** For unauthenticated `/api/` requests return `NextResponse.json({ error: "Not signed in." }, { status: 401 })`. Match public paths with `p === path || path.startsWith(p + "/")`.

**5. Sources can be stuck in `processing` forever, with endless polling**
- **File:** `src/lib/ingest/ingest-text.ts:22`
- **Reviewers:** code-reviewer, architecture-reviewer, test-coverage-check
- **Related:** `src/components/SourcesPanel.tsx:139`
- **Issue:** Only the in-request `catch` resolves `processing`. If the function dies at `maxDuration = 60` or the client disconnects, the row stays `processing`. `SourcesPanel` then calls `router.refresh()` every 3 s indefinitely (4 queries per tick). The cleanup calls in the `catch` block are unchecked too.
- **Fix:** Treat `processing` rows older than 2 to 5 minutes as `failed`, make them deletable and stop polling for them. Check the cleanup results.
- **Not reproduced:** the timeout-kill path is inferred from `maxDuration`.

**6. Note autosave can lose edits**
- **File:** `src/components/StudioPanel.tsx:99`
- **Reviewer:** code-reviewer (medium confidence)
- **Issue:** `saved.current` is advanced before the save succeeds, so a failed UPDATE is never retried. The unmount cleanup clears the timer without flushing, so edits right before closing the tab are lost. Two in-flight saves can land out of order.
- **Fix:** Make `onSave` return `Promise<boolean>` and update `saved.current` only on success. Flush on unmount and on `pagehide`. Drop stale saves with a sequence counter.

**7. Multi-file upload does not refresh after a partial failure**
- **File:** `src/components/SourcesPanel.tsx:329`
- **Reviewer:** code-reviewer
- **Issue:** If file N fails, `onAdded()` never runs, so the list and the count bar stay stale and the remaining files are skipped. The drag-and-drop path refreshes in all cases.
- **Fix:** Refresh in `finally` and collect per-file errors.

**8. Stream error handling in `/api/chat`**
- **File:** `src/app/api/chat/route.ts:98`
- **Reviewer:** code-reviewer (medium confidence)
- **Issue:** After a client abort, the `catch` calls `send` on a cancelled controller, which throws. `controller.close()` in `finally` can throw too. `suggestFollowUps` does not get the abort signal and keeps spending tokens.
- **Fix:** Return early when `request.signal.aborted`, wrap `close()` in try/catch, pass the signal on.
- **Not reproduced.**

**9. Indirect prompt injection**
- **File:** `src/lib/chat/prompt.ts:18`
- **Reviewer:** security-reviewer
- **Issue:** Source text and titles go into the prompts without delimiters or an "untrusted data" rule. The impact is limited to answer integrity: there are no tools, no cross-user data, and the output is rendered as plain text. It becomes a real issue if notebooks become shareable.
- **Fix:** Wrap excerpts in `<excerpt n="1">…</excerpt>`, add the rule to the system prompt, strip `<` and `>` from titles.

**10. Chat does not require `status = 'ready'`**
- **File:** `src/app/api/chat/route.ts:46`
- **Reviewer:** security-reviewer (medium confidence)
- **Issue:** The guide route filters on `ready`, chat does not. Partial or stuck sources stay queryable.
- **Fix:** Add `.eq("status", "ready")`.

**11. HNSW index and filtered search**
- **File:** `supabase/migrations/20261028150000_init.sql:30`
- **Reviewer:** code-reviewer (medium confidence)
- **Issue:** The global HNSW index picks approximate neighbours across all users and filters afterwards. As the table grows, a user can get fewer than 8 chunks and the chat answers "I do not know". Fine at demo scale.
- **Fix:** Set `hnsw.iterative_scan = relaxed_order` (pgvector 0.8 or later) and raise `hnsw.ef_search`, or drop the index until volume needs it.
- **Not checked:** the Supabase project's pgvector version.

<details><summary>Low-confidence or dormant warnings (1) — manual check recommended</summary>

- **Two data-access styles with no stated rule** (`src/components/Workspace.tsx:55`, dormant). Sources and chat go through API routes and `lib/api.ts`. Notes CRUD and source delete go straight from client components to Supabase. RLS is the only guard, and there is no place for rules such as a note size cap. Pick one rule and document it in TECHNICAL.md.

</details>

### 🔵 Info / Minor

- **`MAX_SOURCES = 50` is defined three times** (`sources/route.ts:6`, `chat/route.ts:8`, `SourcesPanel.tsx:19`). Export it from `src/config/limits.ts`, together with `MAX_FILE_BYTES`.
- **Duplicated route preamble** (`api/chat`, `api/guide`, `api/sources`). `sources/route.ts` has no try/catch around `createClient()`, so a missing env var gives an unparseable HTML 500. It also uses `NextResponse.json` where the others use `Response.json`. Extract a shared helper such as `getNotebookContext()`.
- **Domain types live in a UI panel.** `Source` and `Note` are exported from `SourcesPanel.tsx` and imported by `Workspace` and `StudioPanel`. Move them to `src/lib/types.ts`.
- **`openRouterModel` lives in the chat graph module** and is imported by the guide route. The guide also uses `SUGGESTION_MODEL`, so changing the follow-up model changes the guide. Move it to `src/lib/openrouter/chat-model.ts` and add `GUIDE_MODEL`.
- **Guide generation is client-triggered** from a `ChatPanel` effect. Two tabs can duplicate calls, and the staleness rule exists in `ChatPanel` and in the route. `createGuide().finally` bumps `attempt` before the refresh lands, so extra cheap requests can fire.
- **Autosave effect has no dependency array** (`StudioPanel.tsx:106`, dormant). Works today as a debounce; any parent that re-renders faster than 800 ms starves it.
- **Inert `OutOfScope` buttons use `aria-disabled` only** (`Tooltip.tsx:44`, dormant). They stay focusable and the tooltip shows on hover only, so keyboard and touch users never see it. Add `group-focus-within:block`.
- **`match_chunks` is executable by anon** (`init.sql:91`). Not exploitable (security invoker, RLS is `to authenticated`). Revoke from `public, anon` for least privilege, and revoke `handle_new_user()` from everyone.
- **Auth callback and Google route:** no open redirect. Verified safe, optional pin of `origin` to a site URL env var.
- **`SUPABASE_SERVICE_ROLE_KEY` is used only by e2e**, but README says "Yes, server only". Mark it "Optional, local e2e only, never set on Vercel".
- **`citedNumbersSelfCheck` and its stale comment** (`prompt.ts:49-54`). Vitest exists now. Delete the self-check and write real tests.

### ✅ Completeness

- Stale comment `src/lib/chat/prompt.ts:49` ("vitest lands on another branch").
- Unused export `citedNumbersSelfCheck` (`prompt.ts:51`) and `SYSTEM_PROMPT` (`prompt.ts:7`, used only in its file).
- Exports used only inside their file: `GUIDE_CHAR_BUDGET` (`guide.ts:12`), `TextChunk` (`chunk.ts:1`), `IngestInput` (`ingest-text.ts:8`).
- Dead union members `"website"` and `"youtube"` in `IngestInput.type`, the `Source` type (`SourcesPanel.tsx:14`) and its icon branch (line 29). The DB check constraint allows them too. Nothing creates them yet.
- Possible wrong icon: the "Websites" option renders a link icon plus `YouTubeIcon` (`SourcesPanel.tsx:430`).
- `https://openrouter.ai/api/v1` is hard-coded in `graph.ts:44` and `embeddings.ts:8`.
- Info: `E2E_PUBLIC_ONLY`, `E2E_BASE_URL` and `E2E_SHOTS_DIR` are not in `.env.example`.
- No TODO/FIXME, `console.log`, `@ts-ignore` or empty catch blocks found.

### 🧪 Missing Tests

- `src/lib/chat/prompt.ts`: `citedNumbers` (`[10]` must not count as 1, `[12]` out of range, `[0]`), `parseSuggestions`, `buildSystemPrompt`.
- `src/lib/api.ts`: `streamChat` NDJSON parser (JSON line split across chunks, last line without a newline, `error` line, malformed JSON), `addSource` and `createGuide` error paths.
- `src/lib/ingest/ingest-text.ts`: failure path (embedding fails on the second batch, no leftover chunks, source marked `failed`, original error rethrown, and the case where the `failed` update itself errors).
- `src/app/api/{chat,sources,guide}/route.ts`: validation, 404/409/413/415, guide reuse via `sameIds`, 502/500 paths. Only the 401 is covered (`public.spec.ts`).
- `src/lib/chat/graph.ts` and `suggest.ts`: retrieval failure, no-chunks "I do not know", `suggest` swallowing errors.
- `src/lib/supabase/proxy.ts`: public-path matching.
- **No SQL or RLS tests.** Cross-notebook isolation of `match_chunks` is the top missing case. It needs pgTAP or a two-user e2e.

### 🔗 Dependency Changes

Initial snapshot, so there is no previous version to compare against.
- 532 packages added (19 direct, 513 transitive). 0 removed, upgraded or downgraded.
- All 532 `resolved` URLs are on `https://registry.npmjs.org`. All entries have an `integrity` field. No git, file, link or http dependencies.
- Install scripts: `fsevents@2.3.3`, `unrs-resolver@1.12.2`. `eslint@9.39.5` is marked deprecated.
- Risk-signals: none.

---

### 📐 Architectural Observations (codebase-wide, not PR-introduced)

All findings above that the reviewers marked SCOPE: systemic are listed in the Warnings and Info sections. They are tech-debt observations and do not gate the merge verdict.

### 📊 Structural Baseline (Fallow)

Not available. Run `npm install` with Fallow as a devDependency to get duplication, circular-dependency and complexity baselines.

---

## Merge-Verdict

**APPROVE** — 0 Critical. PRD/Issue check not run yet.

### Hard Blockers (must fix before merge)
- None.

### Strongly Recommended (should fix or follow-up ticket before merge)
- DB-level 50-source cap plus narrower RLS on `sources` and `chunks` (Warning 1).
- Input size limits and a rate limit before any public demo (Warning 2).
- Stop returning raw upstream error text (Warning 3).
- Return JSON 401 for `/api/*` on an expired session (Warning 4).
- Stale `processing` sweep and a polling stop (Warning 5).
- Note autosave: retry on failure and flush on unmount (Warning 6).

### Acceptable to Defer (tech-debt, follow-up)
- Warnings 7 to 11, the dormant data-access-style warning and all Info items.
- Missing tests, especially `citedNumbers`, the NDJSON parser and `ingestText`.
- Systemic refactors: shared limits, route helper, shared types, model helper.

### Empfohlene Reihenfolge zum Beheben (für den Dev)
1. Migration: source-cap trigger and narrower RLS, `match_chunks` revoke (Warning 1).
2. Proxy: JSON 401 for `/api/*` and anchored `PUBLIC_PATHS` (Warning 4).
3. Shared limits and input validation in the three routes, plus generic error messages (Warnings 2 and 3, Info `MAX_SOURCES`).
4. Stale-`processing` rule and polling stop (Warning 5).
5. Note autosave fixes (Warning 6) and multi-upload refresh (Warning 7).
6. `status = 'ready'` filter in chat (Warning 10) and the stream abort guard (Warning 8).
7. Tests: `prompt.test.ts`, `api.test.ts`, `ingest-text.test.ts`, then RLS.
8. Remove the stale comment and dead exports.
