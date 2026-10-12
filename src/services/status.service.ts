import "server-only";
import { serverConfig } from "@/config/server.config";
import { mockDiscord, mockHistory, mockUptimePercent } from "@/data/mock";
import { cached } from "@/lib/cache";
import { integrations, modeFor, type DataMode } from "@/lib/env";
import type { DiscordStats, ServiceHealth, StatusHistory, StatusSummary } from "@/types";
import { DiscordService } from "./discord.service";
import { FiveMService } from "./fivem.service";
import { getWeeklyPlaytime } from "./playtime.service";

/** Discord member stats (bot): live, mock (dev) or unavailable. */
export async function getDiscordStats(): Promise<{ mode: DataMode; data: DiscordStats | null }> {
  const mode = modeFor(integrations.discordBot);
  if (mode === "mock") return { mode, data: mockDiscord };
  if (mode === "unavailable") return { mode, data: null };
  try {
    const counts = await DiscordService.getGuildCounts();
    const roleId = serverConfig.discordRoles.whitelist;
    const whitelisted = roleId ? await DiscordService.countRoleMembers(roleId).catch(() => null) : null;
    return { mode, data: { ...counts, whitelisted } };
  } catch {
    return { mode: "unavailable", data: null };
  }
}

async function dbHealthy(): Promise<boolean> {
  if (!integrations.database) return false;
  try {
    const { prisma } = await import("@/lib/store/prisma");
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

/** 30-day uptime from stored snapshots (share of samples where the server was online). */
async function storedUptime(): Promise<number | null> {
  if (!integrations.database) return null;
  try {
    const { prisma } = await import("@/lib/store/prisma");
    const since = new Date(Date.now() - 30 * 86400_000);
    const [total, online] = await Promise.all([
      prisma.serverStatistic.count({ where: { recordedAt: { gte: since } } }),
      prisma.serverStatistic.count({ where: { recordedAt: { gte: since }, online: true } }),
    ]);
    return total ? +((online / total) * 100).toFixed(2) : null;
  } catch {
    return null;
  }
}

export async function getStatusSummary(): Promise<StatusSummary> {
  return cached("status:summary", 15_000, async () => {
    const [fivem, discord, playtime, db, bot, uptime] = await Promise.all([
      FiveMService.getSnapshot(),
      getDiscordStats(),
      getWeeklyPlaytime(),
      dbHealthy(),
      DiscordService.ping(),
      storedUptime(),
    ]);
    const mocking = fivem.mode === "mock";
    const state = (configured: boolean, healthy: boolean): ServiceHealth["state"] => (!configured ? (mocking ? "operational" : "unknown") : healthy ? "operational" : "offline");
    const services: ServiceHealth[] = [
      { id: "fivem", name: "FiveM Server", state: fivem.mode === "unavailable" ? "unknown" : fivem.data?.online ? "operational" : "offline" },
      { id: "database", name: "Database", state: state(integrations.database, db) },
      { id: "bot", name: "Discord Bot", state: state(integrations.discordBot, bot) },
      { id: "website", name: "Website", state: "operational" },
      { id: "auth", name: "Authentication", state: integrations.discordOAuth || mocking ? "operational" : "unknown" },
      { id: "applications", name: "Applications API", state: integrations.database || mocking ? "operational" : "degraded" },
    ];
    return {
      mode: { fivem: fivem.mode, discord: discord.mode, playtime: playtime.mode, history: integrations.database ? "live" : modeFor(false) },
      fivem: fivem.data,
      discord: discord.data,
      playtime: playtime.data,
      uptimePercent: uptime ?? (fivem.mode === "mock" ? mockUptimePercent : null),
      services,
      whitelistOpen: serverConfig.applications.whitelist.open,
      syncedAt: new Date().toISOString(),
    };
  });
}

/** Graph series: from ServerStatistic snapshots when a DB exists, else mock (dev) or empty. */
export async function getStatusHistory(): Promise<{ mode: DataMode; data: StatusHistory }> {
  const empty: StatusHistory = { players24h: [], players7d: [], playtime7d: [], uptime30d: [] };
  if (!integrations.database) {
    const mode = modeFor(false);
    return { mode, data: mode === "mock" ? mockHistory() : empty };
  }
  return cached("status:history", 60_000, async () => {
    try {
      const { prisma } = await import("@/lib/store/prisma");
      const since30 = new Date(Date.now() - 30 * 86400_000);
      const rows = await prisma.serverStatistic.findMany({ where: { recordedAt: { gte: since30 } }, orderBy: { recordedAt: "asc" } });
      const now = Date.now();
      const bucket = (ms: number, count: number, f: (r: typeof rows) => number) =>
        Array.from({ length: count }, (_, i) => {
          const start = now - (count - i) * ms, end = start + ms;
          const inB = rows.filter((r) => +r.recordedAt >= start && +r.recordedAt < end);
          return { t: new Date(end).toISOString(), v: inB.length ? f(inB) : 0 };
        });
      const playtime = await getWeeklyPlaytime();
      return {
        mode: "live" as DataMode,
        data: {
          players24h: bucket(3600_000, 24, (r) => Math.round(r.reduce((s, x) => s + x.players, 0) / r.length)),
          players7d: bucket(86400_000, 7, (r) => Math.max(...r.map((x) => x.players))),
          playtime7d: playtime.daily,
          uptime30d: bucket(86400_000, 30, (r) => +((r.filter((x) => x.online).length / r.length) * 100).toFixed(2)),
        },
      };
    } catch {
      return { mode: "unavailable" as DataMode, data: empty };
    }
  });
}

/** Called by /api/cron/snapshot (e.g. every 5 minutes) to build history. */
export async function recordSnapshot() {
  if (!integrations.database) return { ok: false, reason: "no database" };
  const { prisma } = await import("@/lib/store/prisma");
  const [fivem, discord] = await Promise.all([FiveMService.getSnapshot(), getDiscordStats()]);
  if (fivem.mode !== "live") return { ok: false, reason: "fivem not live" };
  await prisma.serverStatistic.create({
    data: {
      online: fivem.data?.online ?? false,
      players: fivem.data?.players ?? 0,
      maxPlayers: fivem.data?.maxPlayers ?? serverConfig.maxPlayers,
      discordMembers: discord.mode === "live" ? discord.data?.members : null,
      discordOnline: discord.mode === "live" ? discord.data?.online : null,
    },
  });
  return { ok: true };
}
