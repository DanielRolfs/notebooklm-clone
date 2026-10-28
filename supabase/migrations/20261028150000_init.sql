-- Foundation schema: Notebook, Source, Chunk, Note, with Row Level Security.

create extension if not exists vector with schema extensions;

-- Notebook: exactly one per user.
create table public.notebooks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  notebook_id uuid not null references public.notebooks (id) on delete cascade,
  type text not null check (type in ('file', 'website', 'youtube', 'text')),
  title text not null,
  extracted_text text,
  status text not null default 'pending' check (status in ('pending', 'processing', 'ready', 'failed')),
  created_at timestamptz not null default now()
);
create index sources_notebook_id_idx on public.sources (notebook_id);

-- Chunk: notebook_id is denormalised so RLS and search need no join.
create table public.chunks (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.sources (id) on delete cascade,
  notebook_id uuid not null references public.notebooks (id) on delete cascade,
  position integer not null,
  content text not null,
  embedding extensions.vector(1536) not null
);
create index chunks_source_id_idx on public.chunks (source_id);
create index chunks_notebook_id_idx on public.chunks (notebook_id);
create index chunks_embedding_idx on public.chunks using hnsw (embedding extensions.vector_cosine_ops);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  notebook_id uuid not null references public.notebooks (id) on delete cascade,
  title text not null default 'Untitled note',
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index notes_notebook_id_idx on public.notes (notebook_id);

-- Create the user's Notebook on first login (security definer: the user has no insert right yet).
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notebooks (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row Level Security: users only touch rows in their own Notebook.
alter table public.notebooks enable row level security;
alter table public.sources enable row level security;
alter table public.chunks enable row level security;
alter table public.notes enable row level security;

create policy "own notebook" on public.notebooks
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- One policy per child table, same ownership test through notebooks.
create policy "own sources" on public.sources
  for all to authenticated
  using (notebook_id in (select id from public.notebooks where user_id = (select auth.uid())))
  with check (notebook_id in (select id from public.notebooks where user_id = (select auth.uid())));

create policy "own chunks" on public.chunks
  for all to authenticated
  using (notebook_id in (select id from public.notebooks where user_id = (select auth.uid())))
  with check (notebook_id in (select id from public.notebooks where user_id = (select auth.uid())));

create policy "own notes" on public.notes
  for all to authenticated
  using (notebook_id in (select id from public.notebooks where user_id = (select auth.uid())))
  with check (notebook_id in (select id from public.notebooks where user_id = (select auth.uid())));

-- Cosine search limited to the given Sources. Security invoker (default) so RLS still applies.
create function public.match_chunks(
  query_embedding extensions.vector(1536),
  p_notebook_id uuid,
  source_ids uuid[],
  match_count integer default 8
)
returns table (id uuid, source_id uuid, "position" integer, content text, similarity float)
language sql
stable
set search_path = public, extensions
as $$
  select c.id, c.source_id, c.position, c.content,
         1 - (c.embedding <=> query_embedding) as similarity
  from public.chunks c
  where c.notebook_id = p_notebook_id
    and c.source_id = any (source_ids)
  order by c.embedding <=> query_embedding
  limit match_count;
$$;
