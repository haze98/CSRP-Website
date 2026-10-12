import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { serverConfig } from "@/config/server.config";

/* ------------------------------------------------------------ rate limit */
/**
 * Sliding-window rate limiter (in-memory, per process). For multiple
 * instances replace with a shared store (e.g. Redis / Upstash).
 */
const g = globalThis as unknown as { __csrpRate?: Map<string, number[]> };
const hits: Map<string, number[]> = (g.__csrpRate ??= new Map<string, number[]>());

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= limit) {
    hits.set(key, arr);
    return { ok: false, retryAfterSec: Math.ceil((windowMs - (now - arr[0])) / 1000) };
  }
  arr.push(now);
  hits.set(key, arr);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
  return { ok: true, retryAfterSec: 0 };
}

/* ------------------------------------------------------------ request info */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("cf-connecting-ip") || h.get("x-real-ip") || h.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
}

/** Store only a salted hash of the IP unless an event explicitly needs the raw value. */
export function hashIp(ip: string) {
  return createHash("sha256").update(`${process.env.AUTH_SECRET ?? "csrp"}:${ip}`).digest("hex").slice(0, 16);
}

/**
 * CSRF protection for state-changing API routes: browsers always send
 * Origin on cross-site POST/PATCH; reject anything not from our own origin.
 * (Session cookies are also SameSite=Lax.)
 */
export async function assertSameOrigin(): Promise<boolean> {
  const h = await headers();
  const origin = h.get("origin");
  if (!origin) return h.get("sec-fetch-site") === "same-origin";
  const host = h.get("x-forwarded-host") || h.get("host");
  try {
    const o = new URL(origin);
    const allowed = new Set([host, new URL(serverConfig.siteUrl).host].filter(Boolean));
    return allowed.has(o.host);
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------ sanitising */
const ch = (n: number) => String.fromCharCode(n);
// Control chars, zero-width and bidi-override characters. Built from code
// points at runtime so the source file stays plain ASCII.
const INVISIBLE_RANGES: [number, number][] = [
  [0x00, 0x08],
  [0x0b, 0x0c],
  [0x0e, 0x1f],
  [0x7f, 0x7f],
  [0x200b, 0x200f],
  [0x2028, 0x202e],
  [0x2060, 0x206f],
];
const INVISIBLE = new RegExp("[" + INVISIBLE_RANGES.map(([a, b]) => ch(a) + "-" + ch(b)).join("") + "]", "g");
const ZWSP = ch(0x200b);

/** Trim, drop control / invisible characters, normalise long whitespace runs. */
export function sanitizeText(v: string, max = 4000) {
  return v
    .normalize("NFKC")
    .replace(INVISIBLE, "")
    .replace(/[ \t]{3,}/g, "  ")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim()
    .slice(0, max);
}

/** Neutralise Discord mass mentions / user mentions in user content echoed to Discord. */
export function discordSafe(v: string, max = 1000) {
  return v
    .replace(/@(everyone|here)/gi, "@" + ZWSP + "$1")
    .replace(/<@[!&]?\d+>/g, "[mention]")
    .slice(0, max);
}
