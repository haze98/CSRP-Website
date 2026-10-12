import "server-only";
import { serverConfig } from "@/config/server.config";
import { integrations, type DataMode } from "@/lib/env";
import { avatarUrl } from "@/lib/ids";
import type { DeveloperView } from "@/types";
import { DiscordService } from "./discord.service";

/**
 * Developers are defined by MANUALLY configured Discord IDs
 * (DEVELOPER_DISCORD_IDS / server.config.ts) — never by a Discord role.
 * The bot fetches each ID's avatar, username and display name.
 * Title / role / skills come from serverConfig.developers.profiles.
 */
export async function getDevelopers(): Promise<{ mode: DataMode; data: DeveloperView[] }> {
  const ids = serverConfig.developers.ids;
  const live = ids.length > 0 && integrations.discordBot;
  // Never invented: no configured IDs (or no bot) → empty list, rendered as empty slots.
  if (!live) return { mode: "unavailable", data: [] };
  const mode: DataMode = "live";

  const users = await Promise.all(ids.map((id) => DiscordService.getUser(id).catch(() => null)));
  const data = ids
    .map((id, i): DeveloperView | null => {
      const u = users[i];
      if (!u) return null;
      const p = serverConfig.developers.profiles[id] ?? { title: "Developer", role: "Developer", skills: [] };
      return {
        discordId: id,
        displayName: u.global_name ?? u.username,
        username: u.username,
        avatarUrl: avatarUrl(id, u.avatar, 256),
        title: p.title,
        role: p.role,
        skills: p.skills,
        status: "unknown", // presence requires a gateway connection; wire your bot here if needed
      };
    })
    .filter((d): d is DeveloperView => d !== null);
  return { mode, data };
}
