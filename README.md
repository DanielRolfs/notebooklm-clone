# NotebookLM Clone

A small clone of Google NotebookLM. Each user has one Notebook where they collect Sources, write Notes and chat with an AI about the Sources. See `GLOSSARY.md` for the vocabulary and `docs/adr/` for decisions.

This branch is the foundation only: auth, database schema and config. Source ingestion, Notes, Chat and the full UI come later.

Stack: Next.js (App Router, TypeScript, Tailwind), Supabase (Auth, Postgres, pgvector), OpenRouter.

## Setup

1. Install dependencies: `npm install`
2. Create a Supabase project.
3. In Supabase, enable Google under Authentication, Providers. Add `http://localhost:3000/auth/callback` to the redirect URLs.
4. Copy the env template and fill it in: `cp .env.example .env.local`
5. Apply the database migration (below).

### Environment variables

`.env.local` stays on your machine and is git-ignored. `.env.example` is the template and lists where to find each value.

| Variable | Where to get it | Secret |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase: Project Settings, API | No |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase: Project Settings, API Keys (publishable / anon) | No |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase: Project Settings, API Keys (secret / service_role) | Yes, server only |
| `OPENROUTER_API_KEY` | openrouter.ai, Keys (add a few dollars of credit) | Yes, server only |

Google login also needs an OAuth client from Google Cloud Console. Use the callback URL shown under Supabase, Authentication, Providers, Google, then paste the client ID and secret there.

## Run

```bash
npm run dev      # http://localhost:3000
npm run lint
npx tsc --noEmit
npm run build
```

Anonymous visitors are redirected to `/login`. After Google sign-in you land on the home page, which shows your email.

## Migrations

SQL lives in `supabase/migrations/`. With the Supabase CLI:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

Or paste the file into the Supabase SQL editor. The migration enables `vector`, creates `notebooks`, `sources`, `chunks` and `notes` with Row Level Security, creates a Notebook automatically for each new user, and adds `match_chunks` for cosine search.

## Models

Model names are in `src/config/models.ts`. The embedding model must stay at 1536 dimensions to match the `chunks` table.
