import { describe, expect, it } from "vitest";
import { buildGuideSources, parseGuideOutput, sameIds } from "./guide";

const ok = { title: " My Title ", summary: "A **bold** summary.", suggestions: ["a", "b", "c", "d"] };

describe("parseGuideOutput", () => {
  it("parses fenced JSON and trims", () => {
    const r = parseGuideOutput("```json\n" + JSON.stringify(ok) + "\n```");
    expect(r).toEqual({ title: "My Title", summary: "A **bold** summary.", suggestions: ["a", "b", "c"] });
  });
  it("cuts long questions to 90 characters", () => {
    const r = parseGuideOutput(JSON.stringify({ ...ok, suggestions: ["x".repeat(200), "b", "c"] }));
    expect(r?.suggestions[0]).toHaveLength(90);
  });
  it("returns null on bad output", () => {
    expect(parseGuideOutput("no json")).toBeNull();
    expect(parseGuideOutput("{broken")).toBeNull();
    expect(parseGuideOutput(JSON.stringify({ ...ok, suggestions: ["a", "b"] }))).toBeNull();
    expect(parseGuideOutput(JSON.stringify({ ...ok, title: " " }))).toBeNull();
    expect(parseGuideOutput(JSON.stringify({ ...ok, summary: 5 }))).toBeNull();
  });
});

describe("sameIds", () => {
  it("ignores order, detects differences", () => {
    expect(sameIds(["a", "b"], ["b", "a"])).toBe(true);
    expect(sameIds(["a"], ["a", "b"])).toBe(false);
    expect(sameIds(["a", "a"], ["a", "b"])).toBe(false);
    expect(sameIds([], [])).toBe(true);
  });
});

describe("buildGuideSources", () => {
  it("shares the budget evenly", () => {
    const out = buildGuideSources([{ title: "A", text: "x".repeat(100) }, { title: "B", text: "y" }], 20);
    expect(out).toContain("x".repeat(10));
    expect(out).not.toContain("x".repeat(11));
  });
});
