import "server-only";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { mediaSlots, type MediaSlotKey, type ResolvedMedia } from "@/config/media";

/** Picks the first candidate file that exists in /public (checked at render; pages revalidate). */
export function resolveMedia(key: MediaSlotKey): ResolvedMedia {
  const slot = mediaSlots[key];
  const src = slot.files.find((f) => existsSync(join(process.cwd(), "public", f))) ?? null;
  return { ...slot, key, src };
}

export const resolveMediaMany = <K extends MediaSlotKey>(keys: K[]) => Object.fromEntries(keys.map((k) => [k, resolveMedia(k)])) as Record<K, ResolvedMedia>;
