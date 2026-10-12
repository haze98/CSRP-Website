import "server-only";
import { randomUUID } from "node:crypto";
import { applicationPublicId, avatarUrl, ticketPublicId } from "@/lib/ids";
import { ACTIVE_APPLICATION_STATUSES, type ApplicationStatus, type ApplicationView, type AuditLogView, type TicketStatus, type TicketView } from "@/types";
import type { AdminAccessRecord, NewApplication, NewAuditLog, NewTicket, PushSubscriptionRecord, QuizAttemptRecord, Store, UserRecord } from "./types";
import type { NotificationView } from "@/types";

/**
 * DEVELOPMENT-ONLY in-memory store so every flow (login, applications,
 * tickets, admin review) can be exercised without PostgreSQL. Data is kept
 * on globalThis to survive hot reloads and is lost on restart.
 */
type Db = {
  users: UserRecord[];
  apps: (ApplicationView & { userId: string; assignedToId: string | null })[];
  tickets: (TicketView & { userId: string })[];
  logs: (AuditLogView & { actorId: string | null })[];
  counters: Record<string, number>;
  admins: AdminAccessRecord[];
  attempts: QuizAttemptRecord[];
  notifications: (NotificationView & { discordId: string })[];
  push: PushSubscriptionRecord[];
};

const g = globalThis as unknown as { __csrpMemDb?: Db };
const db: Db = (g.__csrpMemDb ??= { users: [], apps: [], tickets: [], logs: [], counters: {}, admins: [], attempts: [], notifications: [], push: [] });
// hot-reload safety when the shape grows
db.admins ??= [];
db.attempts ??= [];
db.notifications ??= [];
db.push ??= [];

const now = () => new Date().toISOString();
const next = (key: string) => (db.counters[key] = (db.counters[key] ?? 0) + 1);
const clone = <T>(v: T): T => structuredClone(v);

const applicant = (u: UserRecord) => ({ id: u.id, discordId: u.discordId, username: u.username, displayName: u.displayName, avatarUrl: avatarUrl(u.discordId, u.avatar) });
const userName = (id: string | null) => db.users.find((u) => u.id === id)?.username ?? "staff";

/** Throws (instead of crashing on undefined) when the applicant has no user record. */
function insertApplication(a: NewApplication) {
  const u = db.users.find((x) => x.id === a.userId);
  if (!u) throw new Error(`memory store: no user ${a.userId}`);
  const rec = {
    id: randomUUID(),
    publicId: applicationPublicId(a.type, next(`app:${a.type}`)),
    type: a.type,
    status: "SUBMITTED" as ApplicationStatus,
    characterName: a.characterName,
    applicant: applicant(u),
    assignedTo: null,
    answers: a.answers,
    reviews: [],
    quiz: a.quiz ? { score: a.quiz.score, total: a.quiz.total } : null,
    roleSyncError: null as string | null,
    createdAt: now(),
    updatedAt: now(),
    userId: a.userId,
    assignedToId: null,
  };
  db.apps.unshift(rec);
  return clone(rec);
}

export const memoryStore: Store = {
  kind: "memory",

  async upsertUser(u) {
    let rec = db.users.find((x) => x.discordId === u.discordId);
    if (rec) Object.assign(rec, u, { lastLoginAt: now() });
    else {
      rec = { id: randomUUID(), ...u, inGuild: false, roleIds: [], rolesCheckedAt: null, createdAt: now(), lastLoginAt: now(), isBanned: false };
      db.users.push(rec);
    }
    return clone(rec);
  },
  async updateUserGuild(userId, data) {
    const u = db.users.find((x) => x.id === userId);
    if (u) Object.assign(u, data, { rolesCheckedAt: now() });
  },
  async getUser(id) {
    return clone(db.users.find((u) => u.id === id) ?? null);
  },
  async getUserByDiscordId(discordId) {
    return clone(db.users.find((u) => u.discordId === discordId) ?? null);
  },
  async listUsers(q, take = 100) {
    const ql = q?.toLowerCase();
    return clone(db.users.filter((u) => !ql || u.username.toLowerCase().includes(ql) || u.discordId.includes(ql)).slice(0, take));
  },
  async countUsers() {
    return db.users.length;
  },

  async createApplication(a: NewApplication) {
    return insertApplication(a);
  },
  async createWhitelistApplication(a) {
    // Synchronous from here on (no await) → atomic within the single JS thread.
    const attempt = db.attempts.find((x) => x.id === a.quiz.attemptId && x.userId === a.userId);
    if (!attempt || !attempt.passed || attempt.usedAt) return { ok: false, reason: "ATTEMPT_USED" };
    if (db.apps.some((x) => x.userId === a.userId && x.type === "whitelist" && ACTIVE_APPLICATION_STATUSES.includes(x.status))) return { ok: false, reason: "ACTIVE_EXISTS" };
    const app = insertApplication(a); // throws before anything is written if the user is missing
    attempt.usedAt = now();
    return { ok: true, app };
  },
  async getApplication(id) {
    return clone(db.apps.find((a) => a.id === id || a.publicId === id) ?? null);
  },
  async listApplications(f) {
    const ql = f.q?.toLowerCase();
    return clone(
      db.apps
        .filter((a) => (!f.type || a.type === f.type) && (!f.status || a.status === f.status))
        .filter((a) => !ql || a.publicId.toLowerCase().includes(ql) || a.applicant.username.toLowerCase().includes(ql) || (a.characterName ?? "").toLowerCase().includes(ql))
        .slice(0, f.take ?? 100),
    );
  },
  async listUserApplications(userId) {
    return clone(db.apps.filter((a) => a.userId === userId));
  },
  async setApplicationStatus(id, status, reviewerId, note, internal = true) {
    const a = db.apps.find((x) => x.id === id);
    if (!a) return null;
    a.reviews.unshift({ id: randomUUID(), reviewerName: userName(reviewerId), fromStatus: a.status, toStatus: status, note, internal, createdAt: now() });
    a.status = status;
    a.updatedAt = now();
    return clone(a);
  },
  async addApplicationNote(id, authorId, note, internal = true) {
    const a = db.apps.find((x) => x.id === id);
    if (!a) return null;
    a.reviews.unshift({ id: randomUUID(), reviewerName: userName(authorId), fromStatus: null, toStatus: null, note, internal, createdAt: now() });
    a.updatedAt = now();
    return clone(a);
  },
  async setApplicationRoleSync(id, error) {
    const a = db.apps.find((x) => x.id === id);
    if (a) a.roleSyncError = error;
  },
  async assignApplication(id, reviewerId, actorId) {
    const a = db.apps.find((x) => x.id === id);
    if (!a) return null;
    a.assignedToId = reviewerId;
    a.assignedTo = reviewerId ? { id: reviewerId, username: userName(reviewerId) } : null;
    a.reviews.unshift({ id: randomUUID(), reviewerName: userName(actorId), fromStatus: null, toStatus: null, note: reviewerId ? `Assigned to ${userName(reviewerId)}` : "Unassigned", internal: true, createdAt: now() });
    return clone(a);
  },
  async countApplications(status) {
    return db.apps.filter((a) => !status || status.includes(a.status)).length;
  },

  async createTicket(t: NewTicket) {
    const u = db.users.find((x) => x.id === t.userId)!;
    const rec = {
      id: randomUUID(),
      publicId: ticketPublicId(next("ticket")),
      type: t.type,
      status: "OPEN" as TicketStatus,
      subject: t.subject,
      body: t.body,
      details: t.details,
      author: { id: u.id, username: u.username, discordId: u.discordId },
      assignedTo: null,
      createdAt: now(),
      updatedAt: now(),
      userId: t.userId,
    };
    db.tickets.unshift(rec);
    return clone(rec);
  },
  async getTicket(id) {
    return clone(db.tickets.find((t) => t.id === id || t.publicId === id) ?? null);
  },
  async listTickets(f) {
    const ql = f.q?.toLowerCase();
    return clone(
      db.tickets
        .filter((t) => (!f.type || t.type === f.type) && (!f.status || t.status === f.status))
        .filter((t) => !ql || t.publicId.toLowerCase().includes(ql) || t.subject.toLowerCase().includes(ql) || t.author.username.toLowerCase().includes(ql))
        .slice(0, f.take ?? 100),
    );
  },
  async listUserTickets(userId) {
    return clone(db.tickets.filter((t) => t.userId === userId));
  },
  async setTicketStatus(id, status, assignedToId) {
    const t = db.tickets.find((x) => x.id === id);
    if (!t) return null;
    t.status = status;
    if (assignedToId !== undefined) t.assignedTo = assignedToId ? { id: assignedToId, username: userName(assignedToId) } : null;
    t.updatedAt = now();
    return clone(t);
  },
  async countTickets(status) {
    return db.tickets.filter((t) => !status || status.includes(t.status)).length;
  },

  async listAdminAccess() {
    return clone(db.admins);
  },
  async getAdminAccess(discordId) {
    return clone(db.admins.find((a) => a.discordId === discordId) ?? null);
  },
  async upsertAdminAccess(a) {
    const cur = db.admins.find((x) => x.discordId === a.discordId);
    if (cur) Object.assign(cur, a);
    else db.admins.push({ ...a, createdAt: now() });
    return clone(db.admins.find((x) => x.discordId === a.discordId)!);
  },

  async createQuizAttempt(a) {
    const rec: QuizAttemptRecord = { id: randomUUID(), userId: a.userId, questionIds: a.questionIds, optionMap: a.optionMap, score: null, passed: null, startedAt: now(), completedAt: null, failedAt: null, nextEligibleAttemptAt: null, usedAt: null };
    db.attempts.unshift(rec);
    return clone(rec);
  },
  async getQuizAttempt(id) {
    return clone(db.attempts.find((x) => x.id === id) ?? null);
  },
  async completeQuizAttempt(id, score, passed, nextEligibleAttemptAt) {
    const a = db.attempts.find((x) => x.id === id);
    if (!a || a.completedAt) return null;
    const at = now();
    Object.assign(a, { score, passed, completedAt: at }, passed ? {} : { failedAt: at, nextEligibleAttemptAt });
    return clone(a);
  },
  async listQuizAttempts(userId) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return clone(db.attempts.filter((a) => !userId || a.userId === userId).map(({ optionMap, ...rest }) => rest));
  },

  async createNotifications(list) {
    for (const n of list) db.notifications.unshift({ id: randomUUID(), discordId: n.discordId, kind: n.kind, title: n.title, body: n.body, href: n.href ?? null, readAt: null, createdAt: now() });
    if (db.notifications.length > 2000) db.notifications.length = 2000;
  },
  async listNotifications(discordId, take = 30) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return clone(db.notifications.filter((n) => n.discordId === discordId).slice(0, take).map(({ discordId: _d, ...n }) => n));
  },
  async markNotificationsRead(discordId, ids) {
    db.notifications.forEach((n) => n.discordId === discordId && !n.readAt && (!ids || ids.includes(n.id)) && (n.readAt = now()));
  },
  async savePushSubscription(sub) {
    db.push = db.push.filter((x) => x.endpoint !== sub.endpoint);
    db.push.push(sub);
  },
  async listPushSubscriptions(discordIds) {
    return clone(db.push.filter((x) => discordIds.includes(x.discordId)));
  },
  async deletePushSubscription(endpoint) {
    db.push = db.push.filter((x) => x.endpoint !== endpoint);
  },

  async createAuditLog(l: NewAuditLog) {
    const actor = db.users.find((u) => u.id === l.actorId);
    db.logs.unshift({
      id: randomUUID(),
      category: l.category,
      action: l.action,
      actor: actor ? { discordId: actor.discordId, username: actor.username } : null,
      actorId: l.actorId ?? null,
      targetId: l.targetId ?? null,
      metadata: l.metadata ?? null,
      createdAt: now(),
    });
    if (db.logs.length > 1000) db.logs.length = 1000;
  },
  async listAuditLogs(category, take = 100) {
    return clone(db.logs.filter((l) => !category || l.category === category).slice(0, take));
  },
};
