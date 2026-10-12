import "server-only";
import { allFields, getDefinition } from "@/config/applications";
import { serverConfig } from "@/config/server.config";
import { sanitizeText } from "@/lib/security";
import { requireStore } from "@/lib/store";
import { applicationSchema, fieldErrors } from "@/lib/validation";
import { ACTIVE_APPLICATION_STATUSES, type ApplicationStatus, type ApplicationType, type ApplicationView, type SessionUser } from "@/types";
import { DiscordService } from "./discord.service";
import { LoggingService } from "./logging.service";

export class ServiceError extends Error {
  constructor(
    message: string,
    public status = 400,
    public fieldErrors?: Record<string, string>,
  ) {
    super(message);
  }
}

const statusLabel = (s: ApplicationStatus) => s.replace(/_/g, " ");

export const ApplicationService = {
  isOpen(type: ApplicationType) {
    return serverConfig.applications[type]?.open ?? false;
  },

  /** Validate + store an application, then log it to Discord. */
  async submit(user: SessionUser, type: ApplicationType, raw: unknown): Promise<ApplicationView> {
    const def = getDefinition(type);
    if (!def) throw new ServiceError("Unknown application type.", 404);
    if (def.flow === "quiz") throw new ServiceError("Whitelist applications use the rule assessment flow.", 400);
    if (!this.isOpen(type)) throw new ServiceError(`${def.short} applications are currently closed.`, 409);

    const parsed = applicationSchema(def).safeParse(raw);
    if (!parsed.success) throw new ServiceError("Please fix the highlighted fields.", 422, fieldErrors(parsed.error));

    const store = await requireStore();
    const mine = await store.listUserApplications(user.id);
    const sameType = mine.filter((a) => a.type === type);
    if (sameType.some((a) => ACTIVE_APPLICATION_STATUSES.includes(a.status))) {
      throw new ServiceError(`You already have an active ${def.short} application. Check its status on your account page.`, 409);
    }
    const lastRejected = sameType.find((a) => a.status === "REJECTED");
    if (lastRejected) {
      const waitMs = serverConfig.applications.cooldownHours * 3600_000 - (Date.now() - new Date(lastRejected.updatedAt).getTime());
      if (waitMs > 0) throw new ServiceError(`You can re-apply for ${def.short} in ${Math.ceil(waitMs / 3600_000)} hours.`, 429);
    }

    const values = parsed.data as Record<string, unknown>;
    const answers = allFields(def)
      .filter((f) => values[f.key] !== undefined && values[f.key] !== "")
      .map((f) => ({ key: f.key, question: f.label, answer: sanitizeText(String(values[f.key]), 2000) }));
    const characterName = def.characterField ? sanitizeText(String(values[def.characterField] ?? ""), 60) || null : null;

    const app = await store.createApplication({ type, userId: user.id, characterName, answers });

    await LoggingService.log({
      category: type === "whitelist" ? "WHITELIST" : "APPLICATION",
      action: type === "whitelist" ? "WHITELIST_REQUESTED" : "APPLICATION_SUBMITTED",
      title: `${def.short.toUpperCase()} APPLICATION`,
      actor: user,
      targetId: app.publicId,
      fields: [
        { name: "Application ID", value: app.publicId, inline: true },
        { name: "Status", value: statusLabel(app.status), inline: true },
        ...(characterName ? [{ name: "Character", value: characterName, inline: true }] : []),
        ...answers.filter((a) => a.key !== def.characterField).slice(0, 18).map((a) => ({ name: a.question.slice(0, 250), value: a.answer })),
      ],
      metadata: { type },
    });
    return app;
  },

  /** Staff: change status → DB + Discord log + optional applicant DM. */
  async setStatus(staff: SessionUser, id: string, status: ApplicationStatus, note: string | null, notify: boolean) {
    const store = await requireStore();
    const before = await store.getApplication(id);
    if (!before) throw new ServiceError("Application not found.", 404);
    const app = await store.setApplicationStatus(before.id, status, staff.id, note ? sanitizeText(note, 1000) : null);
    if (!app) throw new ServiceError("Application not found.", 404);

    const action = status === "ACCEPTED" ? "APPLICATION_ACCEPTED" : status === "REJECTED" ? "APPLICATION_REJECTED" : "APPLICATION_UPDATED";
    await LoggingService.log({
      category: "STAFF",
      action,
      actor: staff,
      targetId: app.publicId,
      fields: [
        { name: "Applicant", value: `<@${app.applicant.discordId}>`, inline: true },
        { name: "Status", value: `${statusLabel(before.status)} → ${statusLabel(status)}`, inline: true },
        ...(note ? [{ name: "Note", value: note }] : []),
      ],
    });

    if (notify && DiscordService.configured()) {
      const def = getDefinition(app.type);
      await DiscordService.dmUser(app.applicant.discordId, {
        embeds: [
          {
            title: `${serverConfig.shortName} — ${def?.short ?? ""} application update`,
            description: `Your application **${app.publicId}** is now **${statusLabel(status)}**.${status === "INTERVIEW" ? "\nPlease join the WFS (Waiting for Support) voice channel when you're available." : ""}`,
            color: status === "ACCEPTED" ? 0x2fd68a : status === "REJECTED" ? 0xd4163c : 0x5f86ff,
            timestamp: new Date().toISOString(),
          },
        ],
      }).catch(() => false);
    }
    return app;
  },

  async addNote(staff: SessionUser, id: string, note: string) {
    const store = await requireStore();
    const app = await store.addApplicationNote(id, staff.id, sanitizeText(note, 1000));
    if (!app) throw new ServiceError("Application not found.", 404);
    await LoggingService.log({ category: "STAFF", action: "APPLICATION_NOTE_ADDED", actor: staff, targetId: app.publicId });
    return app;
  },

  async assign(staff: SessionUser, id: string, reviewerId: string | null) {
    const store = await requireStore();
    const app = await store.assignApplication(id, reviewerId, staff.id);
    if (!app) throw new ServiceError("Application not found.", 404);
    await LoggingService.log({ category: "STAFF", action: "APPLICATION_ASSIGNED", actor: staff, targetId: app.publicId, fields: [{ name: "Reviewer", value: app.assignedTo?.username ?? "unassigned" }] });
    return app;
  },
};
