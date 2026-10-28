import { describe, expect, it } from "vitest";
import { UnsafeUrlError, isBlockedIp, parseWebUrl } from "./safe-fetch";
import { EmptyPageError, extractWebText } from "./extract-web";
import { captionsToText, parseYoutubeId, pickCaptionTrack } from "./extract-youtube";

describe("isBlockedIp", () => {
  it.each([
    "0.0.0.0", "10.1.2.3", "127.0.0.1", "169.254.169.254", "172.16.0.1", "172.31.255.255",
    "192.168.1.1", "100.64.0.1", "100.127.255.255", "::", "::1", "fc00::1", "fd12:3456::1",
    "fe80::1", "::ffff:127.0.0.1", "::ffff:7f00:1", "::ffff:169.254.169.254",
  ])("blocks %s", (ip) => expect(isBlockedIp(ip)).toBe(true));

  it.each(["8.8.8.8", "93.184.216.34", "172.15.0.1", "172.32.0.1", "100.63.0.1", "100.128.0.1", "2606:4700:4700::1111", "::ffff:8.8.8.8"])(
    "allows %s",
    (ip) => expect(isBlockedIp(ip)).toBe(false),
  );

  it("refuses text that is not an IP", () => expect(isBlockedIp("example.com")).toBe(true));
});

describe("parseWebUrl", () => {
  it("accepts http and https", () => {
    expect(parseWebUrl("https://example.com/a?b=1").hostname).toBe("example.com");
    expect(parseWebUrl(" http://example.com ").protocol).toBe("http:");
  });

  it.each(["ftp://example.com", "file:///etc/passwd", "javascript:alert(1)", "not a url", "https://user:pw@example.com", "http://localhost", "http://app.localhost"])(
    "rejects %s",
    (u) => expect(() => parseWebUrl(u)).toThrow(UnsafeUrlError),
  );

  it("rejects links longer than 2048 characters", () => {
    expect(() => parseWebUrl("https://example.com/" + "a".repeat(2048))).toThrow(/too long/);
  });
});

describe("parseYoutubeId", () => {
  const id = (u: string) => parseYoutubeId(new URL(u));
  it("reads the supported link shapes", () => {
    expect(id("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=5")).toBe("dQw4w9WgXcQ");
    expect(id("https://youtu.be/dQw4w9WgXcQ?si=x")).toBe("dQw4w9WgXcQ");
    expect(id("https://m.youtube.com/shorts/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(id("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });
  it("returns null for other links", () => {
    expect(id("https://example.com/watch?v=dQw4w9WgXcQ")).toBeNull();
    expect(id("https://www.youtube.com/watch?v=short")).toBeNull();
    expect(id("https://www.youtube.com/@channel")).toBeNull();
  });
});

describe("pickCaptionTrack", () => {
  const t = (languageCode: string, kind?: string) => ({ baseUrl: `u-${languageCode}-${kind}`, languageCode, kind });
  it("prefers manual English, then manual other, then auto", () => {
    expect(pickCaptionTrack([t("en", "asr"), t("de"), t("en")])?.baseUrl).toBe("u-en-undefined");
    expect(pickCaptionTrack([t("en", "asr"), t("de")])?.baseUrl).toBe("u-de-undefined");
    expect(pickCaptionTrack([t("de", "asr"), t("en", "asr")])?.baseUrl).toBe("u-en-asr");
    expect(pickCaptionTrack([])).toBeNull();
  });
});

describe("captionsToText", () => {
  it("joins segments and skips empty events", () => {
    const json = { events: [{ segs: [{ utf8: "Hello" }, { utf8: " world" }] }, { segs: [{ utf8: "\n" }] }, { segs: [{ utf8: "again" }] }] };
    expect(captionsToText(json)).toBe("Hello world again");
  });
});

describe("extractWebText", () => {
  const filler = "This is a long sentence about the topic of the article. ".repeat(10);
  it("extracts the article and title, without navigation", () => {
    const html = `<html><head><title>My Page</title></head><body>
      <nav>Home About Contact</nav>
      <article><h1>The Headline</h1><p>${filler}</p><p>${filler}</p></article>
      <footer>Copyright</footer></body></html>`;
    const { title, text } = extractWebText(html, "fallback");
    expect(title).toBeTruthy();
    expect(text).toContain("long sentence about the topic");
    expect(text).not.toContain("Copyright");
  });

  it("falls back to the body text when there is no article", () => {
    const { title, text } = extractWebText(`<html><head><title>Plain</title></head><body><div>${filler}</div></body></html>`, "fallback");
    expect(title).toBe("Plain");
    expect(text).toContain("long sentence");
  });

  it("errors when there is almost no text", () => {
    expect(() => extractWebText("<html><body><p>Hi</p></body></html>", "x")).toThrow(EmptyPageError);
  });
});
