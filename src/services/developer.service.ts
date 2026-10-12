import "server-only";
import { serverConfig } from "@/config/server.config";
import { integrations, type DataMode } from "@/lib/env";
import { avatarUrl } from "@/lib/ids";
import type { DeveloperView } from "@/types";
import { DiscordService } from "./discord.service";

/**
 * Developers are defined by MANUALLY configured Discord IDs
 * (serverConfig.developers.ids + DEVELOPER_DISCORD_IDS) — never by a role.
 * The bot fetches each ID's real avatar, username and display name. Until
 * that succeeds the card shows only the configured title + "Awaiting Discord
 * Sync" — no name, avatar or status is ever invented.
 */
const profileOf = (id: string) => serverConfig.developers.profiles[id] ?? { title: "Developer", role: "Development", skills: [] };

/** Configured developers without Discord data (also the page's timeout fallback). */
export function configuredDevelopers(): DeveloperView[] {
  return serverConfig.developers.ids.map((id) => ({ discordId: id, displayName: null, username: null, avatarUrl: null, synced: false, ...profileOf(id), status: "unknown" }));
}

export async function getDevelopers(): Promise<{ mode: DataMode; data: DeveloperView[] }> {
  const base = configuredDevelopers();
  if (!integrations.discordBot) return { mode: "unavailable", data: base };
  const users = await Promise.all(base.map((d) => DiscordService.getUser(d.discordId).catch(() => null)));
  const data = base.map((d, i): DeveloperView => {
    const u = users[i];
    if (!u) return d;
    return {
      ...d,
      displayName: u.global_name ?? u.username,
      username: u.username,
      avatarUrl: avatarUrl(d.discordId, u.avatar, 256),
      synced: true,
      status: "unknown", // presence needs a gateway connection — never guessed
    };
  });
  return { mode: "live", data };
}
