import "server-only";
import { serverConfig } from "@/config/server.config";
import { getStore } from "@/lib/store";
import { discordSafe } from "@/lib/security";
import type { LogCategory, SessionUser } from "@/types";
import { DiscordService } from "./discord.service";

/**
 * LoggingService — the single entry point for website audit events.
 * Every event is (1) written to the AuditLog table and (2) posted as an
 * embed to the Discord channel configured for its category. Failures are
 * swallowed so logging can never break a user request.
 */
const channelFor: Record<LogCategory, string> = {
  AUTH: serverConfig.discordLogChannels.auth,
  APPLICATION: serverConfig.discordLogChannels.application,
  SUPPORT: serverConfig.discordLogChannels.support,
  REPORT: serverConfig.discordLogChannels.report,
  STAFF: serverConfig.discordLogChannels.staff,
  WHITELIST: serverConfig.discordLogChannels.whitelist || serverConfig.discordLogChannels.application,
  STORE: serverConfig.discordLogChannels.store,
  SECURITY: serverConfig.discordLogChannels.security,
};

const colors: Record<LogCategory, number> = {
  AUTH: 0x5f86ff,
  APPLICATION: 0x2f5bff,
  SUPPORT: 0xb0b6c3,
  REPORT: 0xd4163c,
  STAFF: 0xf5b84a,
  WHITELIST: 0x2fd68a,
  STORE: 0xff7a3d,
  SECURITY: 0xa8102f,
};

export interface LogEvent {
  category: LogCategory;
  /** UPPER_SNAKE action, e.g. APPLICATION_SUBMITTED */
  action: string;
  actor?: Pick<SessionUser, "id" | "discordId" | "username"> | null;
  targetId?: string | null;
  /** Only pass for security events where storing it is appropriate. */
  ip?: string | null;
  /** Shown as embed fields (keep short). */
  fields?: { name: string; value: string; inline?: boolean }[];
  metadata?: Record<string, unknown>;
  /** Admin actions: state before / after the change (stored in the audit row). */
  previous?: unknown;
  next?: unknown;
  title?: string;
}

/** Audit rows always carry the actor's verified Discord ID plus any before/after state. */
function auditMetadata(e: LogEvent): Record<string, unknown> | undefined {
  const m: Record<string, unknown> = { ...(e.metadata ?? {}) };
  if (e.actor?.discordId) m.actorDiscordId = e.actor.discordId;
  if (e.previous !== undefined) m.previousState = e.previous;
  if (e.next !== undefined) m.newState = e.next;
  return Object.keys(m).length ? m : undefined;
}

export const LoggingService = {
  async log(e: LogEvent) {
    const timestamp = new Date().toISOString();
    try {
      const store = await getStore();
      await store?.createAuditLog({ category: e.category, action: e.action, actorId: e.actor?.id ?? null, targetId: e.targetId ?? null, ip: e.ip ?? null, metadata: auditMetadata(e) });
    } catch (err) {
      console.error("[audit] db write failed", err);
    }

    const channel = channelFor[e.category];
    if (!DiscordService.configured() || !channel) {
      if (process.env.NODE_ENV !== "production") console.info(`[audit:${e.category}] ${e.action}`, e.targetId ?? "", e.actor?.username ?? "");
      return;
    }
    const fields = [
      ...(e.actor ? [{ name: "User", value: `<@${e.actor.discordId}> · ${discordSafe(e.actor.username, 80)}`, inline: true }, { name: "Discord ID", value: e.actor.discordId, inline: true }] : []),
      ...(e.targetId ? [{ name: "Reference", value: e.targetId, inline: true }] : []),
      ...(e.fields ?? []).map((f) => ({ ...f, value: discordSafe(f.value || "—", 1000) })),
    ].slice(0, 25);
    try {
      await DiscordService.sendChannelMessage(channel, {
        embeds: [
          {
            author: { name: serverConfig.name.toUpperCase() },
            title: e.title ?? e.action.replace(/_/g, " "),
            color: colors[e.category],
            fields,
            footer: { text: `${e.category} · CSRP Website` },
            timestamp,
          },
        ],
      });
    } catch (err) {
      console.error("[audit] discord post failed", err);
    }
  },
};
