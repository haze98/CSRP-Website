import "server-only";

/**
 * Server environment + integration flags. Secrets are read here and never
 * leave the server (this module is `server-only`).
 *
 * DATA MODES — every external value is one of:
 *  - "live"        real integration configured and responding
 *  - "mock"        demo values from src/data/mock. OPT-IN ONLY: development
 *                  with CSRP_MOCK_MODE=true. Never used in production, never
 *                  used by default — real data or an honest empty state.
 *  - "unavailable" production without the integration → shown as "—"
 */
import { serverConfig } from "@/config/server.config";

const e = (k: string) => process.env[k]?.trim() || "";
function cooldownMinutes(raw: string) {
  const n = Number(raw);
  return raw !== "" && Number.isFinite(n) && n >= 0 ? n : serverConfig.whitelist.retryCooldownMinutes;
}

export const env = {
  nodeEnv: process.env.NODE_ENV,
  isProd: process.env.NODE_ENV === "production",

  databaseUrl: e("DATABASE_URL"),

  authSecret: e("AUTH_SECRET") || e("NEXTAUTH_SECRET"),
  discordClientId: e("DISCORD_CLIENT_ID"),
  discordClientSecret: e("DISCORD_CLIENT_SECRET"),
  discordBotToken: e("DISCORD_BOT_TOKEN"),
  discordGuildId: e("DISCORD_GUILD_ID"),
  /** Invite code for member counts — defaults to the code in serverConfig.discordInvite. */
  discordInviteCode: e("DISCORD_INVITE_CODE") || (serverConfig.discordInvite.match(/discord(?:\.gg|\.com\/invite)\/([\w-]+)/)?.[1] ?? ""),

  fivemIp: e("FIVEM_SERVER_IP"),
  fivemPort: e("FIVEM_SERVER_PORT") || "30120",
  fivemExposePlayerNames: e("FIVEM_EXPOSE_PLAYER_NAMES") === "true",

  /** Optional HTTP endpoint from your game server returning playtime stats. */
  playtimeApiUrl: e("PLAYTIME_API_URL"),
  playtimeApiKey: e("PLAYTIME_API_KEY"),

  /**
   * Website admin allowlist — Discord user IDs assigned MANUALLY by the web developer.
   * ADMIN_OWNER_DISCORD_ID: comma-separated OWNER ids (full control, can manage admins).
   * ADMIN_DISCORD_IDS: comma-separated "id" or "id:LEVEL" (LEVEL defaults to ADMIN).
   * Discord roles are never used for website admin access.
   */
  adminOwnerIds: e("ADMIN_OWNER_DISCORD_ID").split(",").map((x) => x.trim()).filter(Boolean),
  adminIds: e("ADMIN_DISCORD_IDS").split(",").map((x) => x.trim()).filter(Boolean),
  /** Server-enforced wait after a failed whitelist quiz. Defaults to serverConfig.whitelist.retryCooldownMinutes (60). */
  whitelistRetryCooldownMinutes: cooldownMinutes(e("WHITELIST_RETRY_COOLDOWN_MINUTES")),
  vapidPublicKey: e("VAPID_PUBLIC_KEY"),
  vapidPrivateKey: e("VAPID_PRIVATE_KEY"),
  vapidSubject: e("VAPID_SUBJECT") || "mailto:admin@example.com",

  /** Allow the in-browser "dev login" when Discord OAuth isn't configured (development only). */
  devLogin: process.env.NODE_ENV !== "production" && e("AUTH_DEV_LOGIN") !== "false",
  forceMock: e("CSRP_MOCK_MODE") === "true",
  disableMock: e("CSRP_MOCK_MODE") === "false",
};

export const integrations = {
  database: Boolean(env.databaseUrl),
  discordOAuth: Boolean(env.discordClientId && env.discordClientSecret),
  discordBot: Boolean(env.discordBotToken && env.discordGuildId),
  fivem: Boolean(env.fivemIp),
  playtime: Boolean(env.playtimeApiUrl),
};

import type { DataMode } from "./env-types";
export type { DataMode };

/** Demo data: development + explicit opt-in only. */
export const mockAllowed = !env.isProd && env.forceMock;

/** In-memory store so forms work locally without a database (development only). */
export const devStoreAllowed = !env.isProd;

/** Resolve the mode for one integration. */
export const modeFor = (configured: boolean): DataMode => (mockAllowed ? "mock" : configured ? "live" : "unavailable");
