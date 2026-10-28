// Single place for model names. Everything goes through OpenRouter (see ADR 0001).
export const CHAT_MODEL = "anthropic/claude-sonnet-5.5";

// Follow-up suggestions. Same model by default; a cheaper one (e.g. a Haiku model) works too.
export const SUGGESTION_MODEL = CHAT_MODEL;

export const EMBEDDING_MODEL = "openai/text-embedding-3-small";
// Must match the vector(1536) column in the chunks table.
export const EMBEDDING_DIMENSIONS = 1536;
