import "server-only";
import { serverConfig } from "@/config/server.config";
import { mockFiveM } from "@/data/mock";
import { cached } from "@/lib/cache";
import { env, integrations, modeFor, type DataMode } from "@/lib/env";
import type { FiveMSnapshot } from "@/types";

/**
 * FiveMService — reads the game server's public endpoints
 * (dynamic.json, info.json, players.json) at FIVEM_SERVER_IP:PORT.
 * Results are cached for 20s so the website never hammers the server.
 * If the server is unreachable we return OFFLINE — never throw.
 */
const TTL = 20_000;
const base = () => `http://${env.fivemIp}:${env.fivemPort}`;

async function getJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${base()}${path}`, { signal: AbortSignal.timeout(3500), cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** Parses an optional "Uptime" server var ("18h 42m", "1d 2h", or seconds). */
function parseUptime(v: unknown): number | null {
  if (typeof v === "number") return v;
  if (typeof v !== "string" || !v.trim()) return null;
  if (/^\d+$/.test(v)) return Number(v);
  let s = 0;
  for (const [, n, u] of v.matchAll(/(\d+)\s*([dhms])/gi)) s += Number(n) * ({ d: 86400, h: 3600, m: 60, s: 1 } as Record<string, number>)[u.toLowerCase()];
  return s || null;
}

export const FiveMService = {
  mode(): DataMode {
    return modeFor(integrations.fivem);
  },

  async getSnapshot(): Promise<{ mode: DataMode; data: FiveMSnapshot | null }> {
    const mode = this.mode();
    if (mode === "mock") return { mode, data: mockFiveM };
    if (mode === "unavailable") return { mode, data: null };

    const data = await cached("fivem:snapshot", TTL, async (): Promise<FiveMSnapshot> => {
      const [dyn, info, players] = await Promise.all([
        getJson<{ clients?: number; sv_maxclients?: string | number; hostname?: string }>("/dynamic.json"),
        getJson<{ vars?: Record<string, unknown> }>("/info.json"),
        getJson<{ name: string }[]>("/players.json"),
      ]);
      if (!dyn && !info && !players) return { online: false, players: 0, maxPlayers: serverConfig.maxPlayers, hostname: null, sessionUptimeSeconds: null };
      const max = Number(dyn?.sv_maxclients ?? info?.vars?.sv_maxClients ?? serverConfig.maxPlayers) || serverConfig.maxPlayers;
      return {
        online: true,
        players: dyn?.clients ?? players?.length ?? 0,
        maxPlayers: max,
        hostname: dyn?.hostname ?? (info?.vars?.sv_projectName as string | undefined) ?? null,
        playerNames: env.fivemExposePlayerNames ? players?.map((p) => p.name).slice(0, 200) : undefined,
        sessionUptimeSeconds: parseUptime(info?.vars?.Uptime ?? info?.vars?.uptime),
      };
    });
    return { mode, data };
  },
};
