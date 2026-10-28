import { describe, expect, it } from "vitest";
import { UnsupportedFileError, extractFileText } from "./extract";

const bytes = (s: string) => new TextEncoder().encode(s);

describe("extractFileText", () => {
  it("reads .txt as UTF-8", async () => {
    expect(await extractFileText("a.txt", bytes("Grüße"))).toBe("Grüße");
  });

  it("reads .md case-insensitively", async () => {
    expect(await extractFileText("README.MD", bytes("# Title"))).toBe("# Title");
  });

  it("rejects other types", async () => {
    await expect(extractFileText("a.docx", bytes("x"))).rejects.toBeInstanceOf(UnsupportedFileError);
    await expect(extractFileText("noextension", bytes("x"))).rejects.toThrow(/Unsupported/);
  });
});
