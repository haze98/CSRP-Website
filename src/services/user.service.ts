import "server-only";
import { serverConfig } from "@/config/server.config";
import { cached, invalidate } from "@/lib/cache";
import { env, integrations } from "@/lib/env";
import { avatarUrl } from "@/lib/ids";
import { getStore } from "@/lib/store";
import type { RoleKey, SessionUser, UserView } from "@/types";
import { AdminService } from "./admin.service";
import { DiscordService } from "./discord.service";

/** Discord snowflake → account creation date. */
export const snowflakeDate = (id: string) => {
  try {
    return new Date(Number((BigInt(id) >> BigInt(22)) + BigInt(1420070400000))).toISOString();
  } catch {
    return null;
  }
};

/** Map Discord role IDs (from the API, never the client) to website roles. */
function rolesFromIds(roleIds: string[]): RoleKey[] {
  const r = serverConfig.discordRoles;
  const out = new Set<RoleKey>();
  (["whitelist", "lspd", "ems", "staff", "creator", "supporter"] as const).forEach((k) => r[k] && roleIds.includes(r[k]) && out.add(k));
  // Informational only (badges, departments). Website ADMIN access is never
  // derived from Discord roles — see AdminService (manual allowlist).
  return [...out];
}

/** Development-only display roles for the dev login (never grants admin). */
const devRoles = (): RoleKey[] => (process.env.AUTH_DEV_ROLES ?? "").split(",").map((s) => s.trim()).filter((r) => r && r !== "admin") as RoleKey[];

export const UserService = {
  /** Called on every sign-in: upsert user + refresh guild membership/roles. Returns internal user id. */
  async syncLogin(u: { discordId: string; username: string; displayName: string | null; avatar: string | null }): Promise<string> {
    const store = await getStore();
    if (!store) return u.discordId; // production without DB: session still works, writes are disabled
    const rec = await store.upsertUser({ ...u, accountCreatedAt: snowflakeDate(u.discordId) });
    await this.refreshGuild(rec.id, u.discordId).catch(() => undefined);
    return rec.id;
  },

  /**
   * Re-validates a session against the store on every request. The JWT only
   * proves which Discord account signed in; the internal user id is looked
   * up again by that verified Discord ID, so a session minted before a
   * database reset (or a dev-server restart wiping the memory store) can't
   * carry a dangling id into writes. Missing records are re-created from the
   * signed token's Discord identity. Banned users get no session.
   */
  async resolveSession(t: { uid: string; discordId: string; username: string; displayName: string | null; avatar: string | null }): Promise<string | null> {
    const store = await getStore();
    if (!store) return t.uid;
    let rec = await store.getUserByDiscordId(t.discordId);
    if (!rec) {
      rec = await store.upsertUser({ discordId: t.discordId, username: t.username, displayName: t.displayName, avatar: t.avatar, accountCreatedAt: snowflakeDate(t.discordId) });
      console.warn(`[auth] session for ${t.discordId} had no user record — restored`);
    }
    return rec.isBanned ? null : rec.id;
  },

  /** Server-side guild + role check through the bot. */
  async refreshGuild(userId: string, discordId: string) {
    if (!integrations.discordBot) return;
    invalidate(`discord:member:${discordId}`);
    const member = await DiscordService.getGuildMember(discordId);
    const store = await getStore();
    await store?.updateUserGuild(userId, { inGuild: Boolean(member), roleIds: member?.roles ?? [] });
  },

  /** Roles for a session user — re-verified against Discord at most every 2 minutes. */
  async getRoles(user: SessionUser): Promise<{ roles: RoleKey[]; inGuild: boolean | null }> {
    if (!integrations.discordBot) {
      const isDevUser = env.devLogin && !integrations.discordOAuth;
      return { roles: isDevUser ? devRoles() : [], inGuild: null };
    }
    return cached(`roles:${user.discordId}`, 2 * 60_000, async () => {
      const member = await DiscordService.getGuildMember(user.discordId).catch(() => undefined);
      if (member === undefined) return { roles: [], inGuild: null }; // Discord unreachable → no elevated roles
      return { roles: member ? rolesFromIds(member.roles) : [], inGuild: Boolean(member) };
    });
  },

  async getView(user: SessionUser): Promise<UserView> {
    const store = await getStore();
    const rec = store ? await store.getUser(user.id) : null;
    const [{ roles, inGuild }, access] = await Promise.all([this.getRoles(user), AdminService.getAccess(user.discordId)]);
    return {
      ...user,
      admin: access ? { level: access.level } : null,
      avatarUrl: user.avatarUrl ?? (rec ? avatarUrl(rec.discordId, rec.avatar) : null),
      roles,
      inGuild,
      accountCreatedAt: rec?.accountCreatedAt ?? snowflakeDate(user.discordId),
      createdAt: rec?.createdAt ?? new Date().toISOString(),
      lastLoginAt: rec?.lastLoginAt ?? null,
    };
  },

};
