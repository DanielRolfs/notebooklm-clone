import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export const MAX_URL_LENGTH = 2048;
const MAX_REDIRECTS = 5;
const TIMEOUT_MS = 10_000;
const MAX_BYTES = 5 * 1024 * 1024;

export class UnsafeUrlError extends Error {}

/** Parses a user URL: http/https only, no credentials, bounded length. Throws UnsafeUrlError. */
export function parseWebUrl(raw: string): URL {
  if (raw.length > MAX_URL_LENGTH) throw new UnsafeUrlError("The link is too long.");
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new UnsafeUrlError("That is not a valid link.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new UnsafeUrlError("Only http and https links are allowed.");
  if (url.username || url.password) throw new UnsafeUrlError("Links with a username or password are not allowed.");
  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost")) throw new UnsafeUrlError("This address is not allowed.");
  return url;
}

function isBlockedV4(ip: string): boolean {
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 0 || // "this" network
    a === 10 ||
    a === 127 || // loopback
    (a === 100 && b >= 64 && b <= 127) || // CGNAT
    (a === 169 && b === 254) || // link-local, cloud metadata (169.254.169.254)
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a >= 224 // multicast and reserved
  );
}

/** Expands an IPv6 address into 8 16-bit groups. Accepts a dotted IPv4 tail. */
function expandV6(ip: string): number[] {
  let s = ip.split("%")[0].toLowerCase();
  const tail = s.match(/(\d+\.\d+\.\d+\.\d+)$/);
  if (tail) {
    const [a, b, c, d] = tail[1].split(".").map(Number);
    s = s.slice(0, -tail[1].length) + ((a << 8) | b).toString(16) + ":" + ((c << 8) | d).toString(16);
  }
  const [head, rest] = s.split("::");
  const h = head ? head.split(":") : [];
  const r = rest ? rest.split(":") : [];
  const zeros = rest === undefined ? [] : Array(8 - h.length - r.length).fill("0");
  return [...h, ...zeros, ...r].map((g) => parseInt(g, 16));
}

/** True for loopback, private, link-local, metadata and other non-public addresses. Pure, no network. */
export function isBlockedIp(ip: string): boolean {
  const kind = isIP(ip);
  if (kind === 4) return isBlockedV4(ip);
  if (kind !== 6) return true; // unknown format: refuse
  const g = expandV6(ip);
  if (g.slice(0, 7).every((x) => x === 0) && g[7] <= 1) return true; // :: and ::1
  if (g.slice(0, 5).every((x) => x === 0) && g[5] === 0xffff) {
    return isBlockedV4(`${g[6] >> 8}.${g[6] & 255}.${g[7] >> 8}.${g[7] & 255}`); // IPv4-mapped
  }
  if ((g[0] & 0xfe00) === 0xfc00) return true; // unique local fc00::/7
  if ((g[0] & 0xffc0) === 0xfe80) return true; // link-local fe80::/10
  if ((g[0] & 0xff00) === 0xff00) return true; // multicast
  return false;
}

async function assertPublicHost(url: URL): Promise<void> {
  const host = url.hostname.replace(/^\[|\]$/g, "");
  let addresses: { address: string }[];
  try {
    addresses = await lookup(host, { all: true });
  } catch {
    throw new UnsafeUrlError("Could not find that website.");
  }
  if (addresses.length === 0 || addresses.some((a) => isBlockedIp(a.address))) {
    throw new UnsafeUrlError("This address is not allowed.");
  }
}

async function readCapped(res: Response): Promise<string> {
  const declared = Number(res.headers.get("content-length"));
  if (declared > MAX_BYTES) throw new UnsafeUrlError("The page is larger than 5 MB.");
  const reader = res.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > MAX_BYTES) {
      await reader.cancel();
      throw new UnsafeUrlError("The page is larger than 5 MB.");
    }
    chunks.push(value);
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}

/**
 * Fetches a page server-side, only after its host resolves to public addresses. Redirects are
 * followed by hand (max 5) and every hop is checked again. Returns the body as text.
 * Limit: the check and the connection resolve DNS separately, so a DNS-rebinding host could still
 * slip through; pinning the resolved IP would need a custom agent.
 */
export async function safeFetchText(rawUrl: string): Promise<{ finalUrl: string; body: string }> {
  let url = parseWebUrl(rawUrl);
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublicHost(url);
    let res: Response;
    try {
      res = await fetch(url, {
        redirect: "manual",
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: { accept: "text/html,text/plain;q=0.9", "user-agent": "Mozilla/5.0 (compatible; NotebookBot/1.0)" },
      });
    } catch (e) {
      throw new UnsafeUrlError(
        e instanceof Error && e.name === "TimeoutError" ? "The website took too long to answer." : "Could not reach that website.",
      );
    }
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      await res.body?.cancel();
      if (!location) throw new UnsafeUrlError("The website sent a broken redirect.");
      url = parseWebUrl(new URL(location, url).href);
      continue;
    }
    if (!res.ok) {
      await res.body?.cancel();
      throw new UnsafeUrlError(`The website answered with an error (${res.status}).`);
    }
    const contentType = (res.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
    if (contentType !== "text/html" && contentType !== "text/plain") {
      await res.body?.cancel();
      throw new UnsafeUrlError("Only web pages and plain text can be added.");
    }
    return { finalUrl: url.href, body: await readCapped(res) };
  }
  throw new UnsafeUrlError("The website redirected too many times.");
}
