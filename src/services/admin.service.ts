import "server-only";
import { cached, invalidate } from "@/lib/cache";
import { env } from "@/lib/env";
import { getStore } from "@/lib/store";
import { ADMIN_LEVELS, ADMIN_PERMISSIONS, LEGACY_ADMIN_PERMISSIONS, type AdminAccessView, type AdminLevel, type AdminPermission, type TicketType } from "@/types";

/**
 * Website admin authorization.
 *
 * Access is granted ONLY by a manual allowlist of Discord user IDs:
 *   1. ADMIN_OWNER_DISCORD_ID (env)  → OWNER
 *   2. ADMIN_DISCORD_IDS (env)       → "id" or "id:LEVEL"
 *   3. AdminAccess table             → managed by an OWNER in /admin/admins
 *
 * The signed-in user's Discord ID comes from the encrypted session cookie
 * and is compared here, on the server. Discord roles, cookies the browser
 * controls, query params and client state are never consulted.
 */
export const LEVEL_DEFAULTS: Record<AdminLevel, AdminPermission[]> = {
  OWNER: [...ADMIN_PERMISSIONS],
  HEAD_ADMIN: ADMIN_PERMISSIONS.filter((p) => p !== "admins.manage"),
  ADMIN: ["whitelist.view", "whitelist.approve", "whitelist.reject", "applications.view", "applications.review", "users.view", "support.view", "support.reply", "reports.view", "reports.manage", "notifications.send", "settings.view", "audit.view"],
  MODERATOR: ["users.view", "support.view", "support.reply", "reports.view", "reports.manage"],
  APPLICATION_REVIEWER: ["whitelist.view", "whitelist.approve", "whitelist.reject", "applications.view", "applications.review"],
};

/** Stored permission names → current granular names. "admins.manage" is never accepted from storage. */
function normalize(stored: string[]): AdminPermission[] {
  const out = new Set<AdminPermission>();
  for (const p of stored) {
    if ((ADMIN_PERMISSIONS as readonly string[]).includes(p)) out.add(p as AdminPermission);
    else LEGACY_ADMIN_PERMISSIONS[p]?.forEach((x) => out.add(x));
  }
  out.delete("admins.manage");
  return [...out];
}

export const LEVEL_LABEL: Record<AdminLevel, string> = {
  OWNER: "Owner",
  HEAD_ADMIN: "Head Admin",
  ADMIN: "Admin",
  MODERATOR: "Moderator",
  APPLICATION_REVIEWER: "Application Reviewer",
};

/** Player reports + ban appeals are "reports"; everything else is "support". */
const REPORT_TYPES: TicketType[] = ["PLAYER_REPORT", "BAN_APPEAL"];
export const ticketPerm = (type: TicketType, mode: "view" | "manage"): AdminPermission =>
  REPORT_TYPES.includes(type) ? (mode === "view" ? "reports.view" : "reports.manage") : mode === "view" ? "support.view" : "support.reply";

const isLevel = (v: string): v is AdminLevel => (ADMIN_LEVELS as readonly string[]).includes(v);
const isSnowflake = (v: string) => /^\d{15,22}$/.test(v) || (process.env.NODE_ENV !== "production" && /^0{14,}\d{1,4}$/.test(v));

function fromEnv(discordId: string): AdminAccessView | null {
  if (env.adminOwnerIds.includes(discordId)) return { discordId, level: "OWNER", permissions: LEVEL_DEFAULTS.OWNER, source: "env-owner", addedBy: "environment", active: true, createdAt: null };
  for (const entry of env.adminIds) {
    const [id, lvl = "ADMIN"] = entry.split(":").map((s) => s.trim());
    if (id === discordId) {
      const level = isLevel(lvl.toUpperCase()) ? (lvl.toUpperCase() as AdminLevel) : "ADMIN";
      // OWNER can only come from ADMIN_OWNER_DISCORD_ID
      const safe: AdminLevel = level === "OWNER" ? "HEAD_ADMIN" : level;
      return { discordId, level: safe, permissions: LEVEL_DEFAULTS[safe], source: "env", addedBy: "environment", active: true, createdAt: null };
    }
  }
  return null;
}

export const AdminService = {
  /**
   * Server-side: the admin access for a Discord ID, or null.
   * Page renders may use a 10s cache; `fresh` (used for every mutating admin
   * request) always re-reads the database, so revoking access makes the
   * very next protected action fail.
   */
  async getAccess(discordId: string | null | undefined, opts: { fresh?: boolean } = {}): Promise<AdminAccessView | null> {
    if (!discordId || !isSnowflake(discordId)) return null;
    const envAccess = fromEnv(discordId);
    if (envAccess) return envAccess;
    const load = async (): Promise<AdminAccessView | null> => {
      const store = await getStore();
      const r = await store?.getAdminAccess(discordId).catch(() => null);
      if (!r || !r.active || !isLevel(r.accessLevel)) return null;
      // DB rows can never be OWNER — ownership is environment-only.
      const level: AdminLevel = r.accessLevel === "OWNER" ? "HEAD_ADMIN" : r.accessLevel;
      const perms = r.permissions.length ? normalize(r.permissions) : LEVEL_DEFAULTS[level].filter((p) => p !== "admins.manage");
      return { discordId, level, permissions: perms, source: "db", addedBy: r.addedBy, active: true, createdAt: r.createdAt };
    };
    if (opts.fresh) {
      invalidate(`admin:${discordId}`);
      return load();
    }
    return cached(`admin:${discordId}`, 10_000, load);
  },

  can(access: AdminAccessView | null, perm?: AdminPermission) {
    return !!access && (!perm || access.permissions.includes(perm));
  },

  /** Every admin (env + DB) for the admin management page. */
  async list(): Promise<AdminAccessView[]> {
    const out: AdminAccessView[] = [];
    for (const id of env.adminOwnerIds) out.push(fromEnv(id)!);
    for (const entry of env.adminIds) {
      const id = entry.split(":")[0].trim();
      if (!out.some((a) => a.discordId === id)) {
        const a = fromEnv(id);
        if (a) out.push(a);
      }
    }
    const store = await getStore();
    for (const r of (await store?.listAdminAccess().catch(() => [])) ?? []) {
      if (out.some((a) => a.discordId === r.discordId) || !isLevel(r.accessLevel)) continue;
      out.push({ discordId: r.discordId, level: r.accessLevel === "OWNER" ? "HEAD_ADMIN" : r.accessLevel, permissions: r.permissions.length ? normalize(r.permissions) : LEVEL_DEFAULTS[r.accessLevel === "OWNER" ? "HEAD_ADMIN" : r.accessLevel].filter((p) => p !== "admins.manage"), source: "db", addedBy: r.addedBy, active: r.active, createdAt: r.createdAt });
    }
    return out;
  },

  /** Discord IDs of active admins holding a permission (notification recipients). */
  async recipients(perm: AdminPermission): Promise<string[]> {
    return (await this.list()).filter((a) => a.active && a.permissions.includes(perm)).map((a) => a.discordId);
  },

  /**
   * OWNER-only mutation (checked by the caller AND here). Owner protection:
   * the OWNER exists only in ADMIN_OWNER_DISCORD_ID, so no admin can remove
   * it, change its Discord ID, grant OWNER (or admins.manage) to anyone —
   * themselves included — or touch env-configured admins from the website.
   * Returns the previous and new state for the audit log.
   */
  async setAccess(actor: AdminAccessView, input: { discordId: string; level: AdminLevel; active: boolean; permissions?: AdminPermission[] }) {
    if (actor.level !== "OWNER" || actor.source !== "env-owner") throw new Error("Only the OWNER can change admin access.");
    if (!isSnowflake(input.discordId)) throw new Error("That doesn't look like a Discord user ID.");
    if (input.level === "OWNER") throw new Error("OWNER can only be set via ADMIN_OWNER_DISCORD_ID.");
    if (input.discordId === actor.discordId || fromEnv(input.discordId)) throw new Error("This ID is configured in environment variables — change it there.");
    const store = await getStore();
    if (!store) throw new Error("Database not connected.");
    const previous = await store.getAdminAccess(input.discordId).catch(() => null);
    const rec = await store.upsertAdminAccess({ discordId: input.discordId, accessLevel: input.level, permissions: normalize(input.permissions ?? []), addedBy: actor.discordId, active: input.active });
    invalidate(`admin:${input.discordId}`);
    return { previous, rec };
  },
};
