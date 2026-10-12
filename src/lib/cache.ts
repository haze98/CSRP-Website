import "server-only";

/**
 * Tiny in-process TTL cache with request coalescing (concurrent callers share
 * one in-flight promise). Good for a single Node instance; swap for Redis if
 * you run several replicas.
 */
type Entry<T> = { value?: T; expires: number; pending?: Promise<T> };
const g = globalThis as unknown as { __csrpCache?: Map<string, Entry<unknown>> };
const store = (g.__csrpCache ??= new Map());

export async function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const hit = store.get(key) as Entry<T> | undefined;
  if (hit && hit.value !== undefined && hit.expires > now) return hit.value;
  if (hit?.pending) return hit.pending;
  const pending = load()
    .then((value) => {
      store.set(key, { value, expires: Date.now() + ttlMs });
      return value;
    })
    .catch((e) => {
      store.delete(key);
      throw e;
    });
  store.set(key, { ...(hit ?? { expires: 0 }), pending });
  return pending;
}

export function invalidate(prefix: string) {
  for (const k of store.keys()) if (k.startsWith(prefix)) store.delete(k);
}
