# RAG with pgvector, through OpenRouter

Chat answers use retrieval: Sources are split into Chunks, embedded and stored in Supabase pgvector. We chose this over sending full Source text to Claude because the company uses Supabase and the project should show a real retrieval pipeline, even though the Source limit would allow full-context.

Chat and embeddings go through one OpenRouter key, because Anthropic offers no embedding model. Citations are prompt-based, since OpenRouter has no native citations feature.
