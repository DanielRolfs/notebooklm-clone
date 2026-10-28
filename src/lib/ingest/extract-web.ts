import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";

const MIN_CHARS = 50;

export class EmptyPageError extends Error {}

const tidy = (s: string) => s.replace(/[ \t]+/g, " ").replace(/\s*\n\s*/g, "\n").trim();

/** Main article text and title of an HTML page. Falls back to <title> and the stripped body. */
export function extractWebText(html: string, fallbackTitle: string): { title: string; text: string } {
  const { document } = parseHTML(html);
  const pageTitle = document.title?.trim() ?? "";

  let article: { title?: string | null; textContent?: string | null } | null = null;
  try {
    // Readability edits the document it parses, so give it a copy.
    article = new Readability(document.cloneNode(true) as unknown as Document).parse();
  } catch {}
  let text = tidy(article?.textContent ?? "");

  if (text.length < MIN_CHARS) {
    document.querySelectorAll("script, style, noscript, nav, header, footer").forEach((el) => el.remove());
    text = tidy((document.body ?? document.documentElement)?.textContent ?? "");
  }
  if (text.length < MIN_CHARS) {
    throw new EmptyPageError("This page has almost no readable text (it may need JavaScript or a login).");
  }
  return { title: article?.title?.trim() || pageTitle || fallbackTitle, text };
}
