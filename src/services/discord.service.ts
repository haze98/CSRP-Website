import "server-only";
import { cached } from "@/lib/cache";
import { env, integrations } from "@/lib/env";

/**
 * DiscordService — all Discord REST calls, server-side only, authenticated
 * with the bot token (never exposed to the browser).
 */
const API = "https://discord.com/api/v10";

export interface DiscordUser {
  id: string;
  username: string;
  global_name: string | null;
  avatar: string | null;
}

export interface DiscordMember {
  roles: string[];
  joined_at: string;
  nick: string | null;
}

export interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  fields?: { name: string; value: string; inline?: boolean }[];
  footer?: { text: string };
  timestamp?: string;
  author?: { name: string; icon_url?: string };
}

async function discordFetch(path: string, init: RequestInit = {}, retry = true): Promise<Response> {
  if (!env.discordBotToken) throw new Error("Discord bot is not configured");
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bot ${env.discordBotToken}`, "Content-Type": "application/json", "User-Agent": "CSRP-Website (https://csrp, 1.0)", ...(init.headers ?? {}) },
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
  if (res.status === 429 && retry) {
    const body = (await res.json().catch(() => ({}))) as { retry_after?: number };
    await new Promise((r) => setTimeout(r, Math.min(5000, (body.retry_after ?? 1) * 1000)));
    return discordFetch(path, init, false);
  }
  return res;
}

export const DiscordService = {
  configured: () => integrations.discordBot,

  /** Public profile of any user by ID (used for developer cards). Cached 10 min. */
  getUser(id: string) {
    return cached(`discord:user:${id}`, 10 * 60_000, async () => {
      const res = await discordFetch(`/users/${id}`);
      if (!res.ok) return null;
      return (await res.json()) as DiscordUser;
    });
  },

  /** Guild membership + role IDs for a user (server-side role checks). Cached 2 min. */
  getGuildMember(userId: string) {
    return cached(`discord:member:${userId}`, 2 * 60_000, async () => {
      const res = await discordFetch(`/guilds/${env.discordGuildId}/members/${userId}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`member lookup failed (${res.status})`);
      return (await res.json()) as DiscordMember;
    });
  },

  /** Approximate member / online counts. Cached 60s. */
  getGuildCounts() {
    return cached("discord:counts", 60_000, async () => {
      const res = await discordFetch(`/guilds/${env.discordGuildId}?with_counts=true`);
      if (!res.ok) throw new Error(`guild lookup failed (${res.status})`);
      const g = (await res.json()) as { approximate_member_count?: number; approximate_presence_count?: number };
      return { members: g.approximate_member_count ?? 0, online: g.approximate_presence_count ?? 0 };
    });
  },

  /**
   * Members holding a role. Requires the privileged GUILD_MEMBERS intent;
   * returns null if the bot can't list members. Cached 10 min.
   */
  countRoleMembers(roleId: string) {
    return cached(`discord:rolecount:${roleId}`, 10 * 60_000, async () => {
      let after = "0", count = 0;
      for (let page = 0; page < 50; page++) {
        const res = await discordFetch(`/guilds/${env.discordGuildId}/members?limit=1000&after=${after}`);
        if (!res.ok) return null;
        const members = (await res.json()) as (DiscordMember & { user: { id: string } })[];
        count += members.filter((m) => m.roles.includes(roleId)).length;
        if (members.length < 1000) break;
        after = members[members.length - 1].user.id;
      }
      return count;
    });
  },

  async sendChannelMessage(channelId: string, payload: { content?: string; embeds?: DiscordEmbed[] }) {
    const res = await discordFetch(`/channels/${channelId}/messages`, {
      method: "POST",
      body: JSON.stringify({ ...payload, allowed_mentions: { parse: [] } }),
    });
    if (!res.ok) throw new Error(`send message failed (${res.status})`);
  },

  /** DM a user (e.g. application decision). Fails silently if DMs are closed. */
  async dmUser(userId: string, payload: { content?: string; embeds?: DiscordEmbed[] }) {
    const ch = await discordFetch(`/users/@me/channels`, { method: "POST", body: JSON.stringify({ recipient_id: userId }) });
    if (!ch.ok) return false;
    const { id } = (await ch.json()) as { id: string };
    const res = await discordFetch(`/channels/${id}/messages`, { method: "POST", body: JSON.stringify({ ...payload, allowed_mentions: { parse: [] } }) });
    return res.ok;
  },

  /**
   * Grant a guild role (e.g. whitelist) — called ONLY from server-side admin
   * approval. Requires the bot's role to be above the target role.
   */
  async addMemberRole(userId: string, roleId: string): Promise<{ ok: true } | { ok: false; error: string }> {
    if (!integrations.discordBot) return { ok: false, error: "Discord bot not configured" };
    if (!roleId) return { ok: false, error: "DISCORD_WHITELIST_ROLE_ID not set" };
    try {
      const res = await discordFetch(`/guilds/${env.discordGuildId}/members/${userId}/roles/${roleId}`, { method: "PUT", headers: { "X-Audit-Log-Reason": "CSRP website whitelist approval" } });
      if (res.status === 204 || res.ok) return { ok: true };
      if (res.status === 404) return { ok: false, error: "User is not in the Discord server" };
      if (res.status === 403) return { ok: false, error: "Bot lacks permission (Manage Roles / role order)" };
      return { ok: false, error: `Discord returned ${res.status}` };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Discord request failed" };
    }
  },

  /** Lightweight health check for the status page. */
  async ping(): Promise<boolean> {
    if (!integrations.discordBot) return false;
    try {
      const res = await discordFetch(`/users/@me`);
      return res.ok;
    } catch {
      return false;
    }
  },
};
