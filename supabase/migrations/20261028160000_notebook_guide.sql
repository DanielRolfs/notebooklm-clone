-- Auto "notebook guide": title, summary and 3 questions, stored per Notebook.
-- Shape: { title, summary, suggestions: [3 strings], sourceIds: string[], createdAt }
-- RLS on notebooks already covers the new column.
alter table public.notebooks add column guide jsonb;
