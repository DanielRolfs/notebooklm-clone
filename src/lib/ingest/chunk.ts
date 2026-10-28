export type TextChunk = { position: number; content: string };

// Tokens are approximated as chars / 4 (no tokenizer dependency).
const CHUNK_CHARS = 800 * 4;
const OVERLAP_CHARS = 100 * 4;

// Break after a paragraph, then a sentence, then a space; the last resort is a hard cut.
function cutPoint(text: string, start: number, max: number): number {
  const end = Math.min(start + max, text.length);
  if (end === text.length) return end;
  const window = text.slice(start, end);
  const floor = Math.floor(max / 2); // do not cut so early that chunks get tiny
  for (const sep of ["\n\n", ". ", "\n", " "]) {
    const i = window.lastIndexOf(sep);
    if (i >= floor) return start + i + sep.length;
  }
  return end;
}

export function chunkText(text: string): TextChunk[] {
  const clean = text.replace(/\r\n/g, "\n").trim();
  const chunks: TextChunk[] = [];
  let start = 0;
  while (start < clean.length) {
    const end = cutPoint(clean, start, CHUNK_CHARS);
    const content = clean.slice(start, end).trim();
    if (content) chunks.push({ position: chunks.length, content });
    if (end >= clean.length) break;
    // Overlap is always smaller than the chunk, so start strictly advances.
    start = Math.max(end - OVERLAP_CHARS, start + 1);
  }
  return chunks;
}
