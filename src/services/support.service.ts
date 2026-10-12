import "server-only";
import { getSupportDefinition } from "@/config/support";
import { sanitizeText } from "@/lib/security";
import { requireStore } from "@/lib/store";
import { fieldErrors, supportSchema } from "@/lib/validation";
import type { SessionUser, TicketStatus, TicketType } from "@/types";
import { ServiceError } from "./application.service";
import { LoggingService } from "./logging.service";

const actionFor: Record<TicketType, string> = {
  SUPPORT: "SUPPORT_TICKET_CREATED",
  PLAYER_REPORT: "REPORT_CREATED",
  BAN_APPEAL: "BAN_APPEAL_CREATED",
  BUG_REPORT: "BUG_REPORT_CREATED",
  CONTACT: "STAFF_CONTACT_CREATED",
};

export const SupportService = {
  async create(user: SessionUser, slugOrType: string, raw: unknown) {
    const def = getSupportDefinition(slugOrType);
    if (!def) throw new ServiceError("Unknown request type.", 404);
    const parsed = supportSchema(def).safeParse(raw);
    if (!parsed.success) throw new ServiceError("Please fix the highlighted fields.", 422, fieldErrors(parsed.error));

    const v = parsed.data as Record<string, unknown>;
    const details = Object.fromEntries(def.fields.filter((f) => v[f.key] !== undefined && v[f.key] !== "").map((f) => [f.key, sanitizeText(String(v[f.key]), 1500)]));
    const store = await requireStore();
    const ticket = await store.createTicket({ type: def.type, userId: user.id, subject: sanitizeText(String(v.subject), 120), body: sanitizeText(String(v.body), 4000), details });

    await LoggingService.log({
      category: def.type === "PLAYER_REPORT" || def.type === "BAN_APPEAL" ? "REPORT" : "SUPPORT",
      action: actionFor[def.type],
      title: def.label.toUpperCase(),
      actor: user,
      targetId: ticket.publicId,
      fields: [
        { name: "Ticket ID", value: ticket.publicId, inline: true },
        { name: "Status", value: ticket.status, inline: true },
        { name: "Subject", value: ticket.subject },
        { name: "Details", value: ticket.body },
        ...def.fields.filter((f) => details[f.key]).map((f) => ({ name: f.label, value: details[f.key], inline: f.kind !== "textarea" })),
      ],
    });
    return ticket;
  },

  async setStatus(staff: SessionUser, id: string, status: TicketStatus, assignToSelf: boolean) {
    const store = await requireStore();
    const t = await store.setTicketStatus(id, status, assignToSelf ? staff.id : undefined);
    if (!t) throw new ServiceError("Ticket not found.", 404);
    await LoggingService.log({ category: "STAFF", action: "TICKET_UPDATED", actor: staff, targetId: t.publicId, fields: [{ name: "Status", value: status.replace(/_/g, " "), inline: true }] });
    return t;
  },
};
