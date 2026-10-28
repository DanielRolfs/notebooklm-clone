import { describe, expect, it } from "vitest";
import { chunkText } from "./chunk";

describe("chunkText", () => {
  it("returns nothing for empty or blank input", () => {
    expect(chunkText("")).toEqual([]);
    expect(chunkText("  \n\n ")).toEqual([]);
  });

  it("keeps short text as one chunk", () => {
    expect(chunkText("Hello world.")).toEqual([{ position: 0, content: "Hello world." }]);
  });

  it("splits long text into numbered chunks of at most ~800 tokens", () => {
    const text = Array.from({ length: 200 }, (_, i) => `Paragraph ${i}. ${"word ".repeat(60)}`).join("\n\n");
    const chunks = chunkText(text);
    expect(chunks.length).toBeGreaterThan(1);
    chunks.forEach((c, i) => {
      expect(c.position).toBe(i);
      expect(c.content.length).toBeLessThanOrEqual(3200);
    });
  });

  it("overlaps neighbouring chunks", () => {
    const text = Array.from({ length: 200 }, (_, i) => `Sentence number ${i} is here. `).join("");
    const chunks = chunkText(text);
    const tail = chunks[0].content.slice(-100);
    expect(chunks[1].content.includes(tail)).toBe(true);
  });

  it("handles one very long paragraph without spaces", () => {
    const chunks = chunkText("x".repeat(10000));
    expect(chunks.length).toBeGreaterThan(3);
    expect(chunks[0].content.length).toBe(3200);
    expect(chunks.every((c) => c.content.length <= 3200)).toBe(true);
  });
});
