import "server-only";
import { mockHistory, mockPlaytime } from "@/data/mock";
import { cached } from "@/lib/cache";
import { env, integrations, modeFor, type DataMode } from "@/lib/env";
import type { PlaytimeStats, SeriesPoint } from "@/types";

/**
 * Playtime must come from the game database (Qbox/QBCore/ESX via oxmysql).
 * Integration point: expose an authenticated endpoint from your server
 * (PLAYTIME_API_URL) returning:
 *   { weeklyHours, averageSessionMinutes, peakPlayers, daily: [{ t, v }] }
 * Until then: mock in development, null in production (never faked).
 */
export async function getWeeklyPlaytime(): Promise<{ mode: DataMode; data: PlaytimeStats | null; daily: SeriesPoint[] }> {
  const mode = modeFor(integrations.playtime);
  if (mode === "mock") return { mode, data: mockPlaytime, daily: mockHistory().playtime7d };
  if (mode === "unavailable") return { mode, data: null, daily: [] };
  try {
    const res = await cached("playtime", 5 * 60_000, async () => {
      const r = await fetch(env.playtimeApiUrl, {
        headers: env.playtimeApiKey ? { Authorization: `Bearer ${env.playtimeApiKey}` } : {},
        signal: AbortSignal.timeout(5000),
        cache: "no-store",
      });
      if (!r.ok) throw new Error(String(r.status));
      return (await r.json()) as PlaytimeStats & { daily?: SeriesPoint[] };
    });
    return { mode, data: { weeklyHours: res.weeklyHours, averageSessionMinutes: res.averageSessionMinutes, peakPlayers: res.peakPlayers }, daily: res.daily ?? [] };
  } catch {
    return { mode: "unavailable", data: null, daily: [] };
  }
}
