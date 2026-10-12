/**
 * ============================================================
 *  DEVELOPMENT MOCK DATA — the ONLY place fake values live.
 * ============================================================
 * Used only when an integration is missing AND mock mode is allowed
 * (development, or CSRP_MOCK_MODE=true). The UI labels these values as
 * mock. Delete this folder's usages once every integration is live.
 */
import type { DiscordStats, FiveMSnapshot, PlaytimeStats, SeriesPoint, StatusHistory } from "@/types";

export const mockFiveM: FiveMSnapshot = {
  online: true,
  players: 42,
  maxPlayers: 128,
  hostname: "Chandra Surya Roleplay | Serious RP | Nepal",
  sessionUptimeSeconds: 18 * 3600 + 42 * 60,
};

export const mockDiscord: DiscordStats = { members: 1247, online: 382, whitelisted: 604 };

export const mockPlaytime: PlaytimeStats = { weeklyHours: 3842, averageSessionMinutes: 137, peakPlayers: 91 };

export const mockUptimePercent = 99.92;

/* Deterministic pseudo-random so mock graphs don't change on every render. */
function seeded(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

export function mockHistory(now = new Date()): StatusHistory {
  const r = seeded(42);
  const hourly: SeriesPoint[] = Array.from({ length: 24 }, (_, i) => {
    const d = new Date(now.getTime() - (23 - i) * 3600_000);
    const h = d.getHours();
    // evening peak (NPT), quiet early morning
    const base = 18 + 52 * Math.max(0, Math.sin(((h - 9) / 24) * Math.PI * 2 - 0.3)) ** 1.4;
    return { t: d.toISOString(), v: Math.round(base + r() * 8) };
  });
  const daily = (n: number, f: (i: number) => number): SeriesPoint[] =>
    Array.from({ length: n }, (_, i) => ({ t: new Date(now.getTime() - (n - 1 - i) * 86400_000).toISOString(), v: f(i) }));
  return {
    players24h: hourly,
    players7d: daily(7, (i) => Math.round(62 + (i % 7 >= 4 ? 22 : 0) + r() * 12)),
    playtime7d: daily(7, (i) => Math.round(470 + (i % 7 >= 4 ? 160 : 0) + r() * 90)),
    uptime30d: daily(30, () => +(99.4 + r() * 0.6).toFixed(2)),
  };
}


/** Identity used by the development-only "dev login" (never in production). */
/** Local test identities for the development-only login (never available in production). */
export const devPersonas = {
  player: { discordId: "000000000000000001", username: "dev.player", displayName: "Dev Player" },
  citizen: { discordId: "000000000000000002", username: "test.citizen", displayName: "Test Citizen" },
} as const;
export type DevPersona = keyof typeof devPersonas;
export const mockDevUser = devPersonas.player;
