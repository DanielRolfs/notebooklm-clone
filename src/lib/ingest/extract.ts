import { extractText, getDocumentProxy } from "unpdf";

export const MAX_FILE_BYTES = 10 * 1024 * 1024;

export class UnsupportedFileError extends Error {}

// Returns the plain text of an uploaded file. Throws UnsupportedFileError for other types.
export async function extractFileText(name: string, data: Uint8Array): Promise<string> {
  const ext = name.toLowerCase().split(".").pop();
  if (ext === "txt" || ext === "md") return new TextDecoder("utf-8").decode(data);
  if (ext === "pdf") {
    const pdf = await getDocumentProxy(data);
    const { text } = await extractText(pdf, { mergePages: true });
    return text;
  }
  throw new UnsupportedFileError("Unsupported file type. Upload a PDF, .txt or .md file.");
}
