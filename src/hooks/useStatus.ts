"use client";
import { useEffect, useRef, useSyncExternalStore } from "react";
import type { ApiResult, StatusSummary } from "@/types";

/**
 * One shared poller of /api/status for every component on the page
 * (navbar pill, hero, quick bar, status preview). Polls every 30s while the
 * tab is visible; the server caches FiveM/Discord for ~15-20s anyway.
 */
type State = { data: StatusSummary | null; error: boolean; loading: boolean };
let state: State = { data: null, error: false, loading: true };
const subs = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;
let inflight: Promise<void> | null = null;
let users = 0;

const emit = (next: Partial<State>) => {
  state = { ...state, ...next };
  subs.forEach((f) => f());
};

async function load() {
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const r = await fetch("/api/status", { cache: "no-store" });
      const j = (await r.json()) as ApiResult<StatusSummary>;
      if (j.ok) emit({ data: j.data, error: false, loading: false });
      else emit({ error: true, loading: false });
    } catch {
      emit({ error: true, loading: false });
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

const onVis = () => {
  if (!document.hidden) load();
};

/** Seed with server-rendered data so the first paint has no skeleton jump. */
export function primeStatus(data: StatusSummary | null) {
  if (data && !state.data) state = { data, error: false, loading: false };
}

export function useStatus(initial?: StatusSummary | null) {
  if (initial) primeStatus(initial);
  // stable server snapshot (must be referentially cached)
  const serverSnap = useRef<State>(initial ? { data: initial, error: false, loading: false } : state);
  const snap = useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => subs.delete(f);
    },
    () => state,
    () => serverSnap.current,
  );

  useEffect(() => {
    users++;
    if (users === 1) {
      if (!state.data || Date.now() - new Date(state.data.syncedAt).getTime() > 15_000) load();
      timer = setInterval(() => !document.hidden && load(), 30_000);
      document.addEventListener("visibilitychange", onVis);
    }
    return () => {
      users--;
      if (users === 0) {
        if (timer) clearInterval(timer);
        timer = null;
        document.removeEventListener("visibilitychange", onVis);
      }
    };
  }, []);

  return { ...snap, refresh: load };
}
