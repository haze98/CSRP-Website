/**
 * Resolve `p`, or `fallback` after `ms` (or on error). Used so pages never
 * wait on slow/unreachable integrations: the page renders immediately with
 * "Connecting…" states and the client refreshes the data. The original
 * promise keeps running and warms the server cache for that refresh.
 */
export function within<T, F>(p: Promise<T>, ms: number, fallback: F): Promise<T | F> {
  return new Promise((resolve) => {
    const t = setTimeout(() => resolve(fallback), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      () => {
        clearTimeout(t);
        resolve(fallback);
      },
    );
  });
}
