export class NoCaptionsError extends Error {}

const NO_CAPTIONS = "This video has no captions we can read.";
const ID = /^[\w-]{11}$/;

/** Video id from watch?v=, youtu.be/, /shorts/ and /embed/ links, or null. Pure. */
export function parseYoutubeId(url: URL): string | null {
  const host = url.hostname.toLowerCase().replace(/^(www|m|music)\./, "");
  let id: string | null = null;
  if (host === "youtu.be") id = url.pathname.split("/")[1] ?? null;
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const [, kind, second] = url.pathname.split("/");
    if (kind === "watch") id = url.searchParams.get("v");
    else if (kind === "shorts" || kind === "embed") id = second ?? null;
  }
  return id && ID.test(id) ? id : null;
}

type Track = { baseUrl: string; languageCode: string; kind?: string };

/** Prefers a manual track over auto-generated ones; English first, then any. Pure. */
export function pickCaptionTrack(tracks: Track[]): Track | null {
  const rank = (t: Track) => (t.kind === "asr" ? 2 : 0) + (t.languageCode.toLowerCase().startsWith("en") ? 0 : 1);
  return [...tracks].sort((a, b) => rank(a) - rank(b))[0] ?? null;
}

/** Joins the json3 caption format ({events:[{segs:[{utf8}]}]}) into plain text. Pure. */
export function captionsToText(json: { events?: { segs?: { utf8?: string }[] }[] }): string {
  return (json.events ?? [])
    .map((e) => (e.segs ?? []).map((s) => s.utf8 ?? "").join("").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join(" ");
}

const timeout = () => AbortSignal.timeout(10_000);

/**
 * Title via oEmbed, captions via YouTube's internal player endpoint (the one the Android app
 * uses). That endpoint is undocumented and can change. YouTube also sometimes blocks datacenter IPs
 * (such as Vercel's); then this fails with the "no captions" message even for videos that have them.
 */
export async function fetchYoutube(id: string): Promise<{ title: string; text: string }> {
  const oembed = await fetch(
    `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}&format=json`,
    { signal: timeout() },
  ).catch(() => null);
  if (!oembed?.ok) throw new Error("Could not find that YouTube video.");
  const title = String((await oembed.json().catch(() => null))?.title ?? "").trim() || `YouTube video ${id}`;

  const player = await fetch("https://www.youtube.com/youtubei/v1/player?prettyPrint=false", {
    method: "POST",
    signal: timeout(),
    headers: { "content-type": "application/json", "user-agent": "com.google.android.youtube/20.10.38 (Linux; U; Android 14)" },
    body: JSON.stringify({ context: { client: { clientName: "ANDROID", clientVersion: "20.10.38" } }, videoId: id }),
  }).catch(() => null);
  if (!player?.ok) throw new NoCaptionsError(NO_CAPTIONS);
  const data = await player.json().catch(() => null);
  const track = pickCaptionTrack(data?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? []);

  // Only follow caption links that point at YouTube itself.
  let captionUrl: URL;
  try {
    captionUrl = new URL(track?.baseUrl ?? "");
  } catch {
    throw new NoCaptionsError(NO_CAPTIONS);
  }
  if (captionUrl.protocol !== "https:" || !captionUrl.hostname.endsWith(".youtube.com")) throw new NoCaptionsError(NO_CAPTIONS);
  captionUrl.searchParams.set("fmt", "json3");

  const res = await fetch(captionUrl, { signal: timeout() }).catch(() => null);
  const json = res?.ok ? await res.json().catch(() => null) : null;
  const text = json ? captionsToText(json) : "";
  if (!text) throw new NoCaptionsError(NO_CAPTIONS);
  return { title, text };
}
