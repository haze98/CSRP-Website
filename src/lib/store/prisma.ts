import "server-only";
import { Prisma, PrismaClient, type ApplicationType as DbAppType } from "@prisma/client";
import { applicationPublicId, avatarUrl, ticketPublicId } from "@/lib/ids";
import { ACTIVE_APPLICATION_STATUSES, type AdminPermission, type ApplicationType, type ApplicationView, type AuditLogView, type LogCategory, type TicketView } from "@/types";
import type { AdminAccessRecord, QuizAttemptRecord, Store, UserRecord } from "./types";

const g = globalThis as unknown as { __csrpPrisma?: PrismaClient };
export const prisma = (g.__csrpPrisma ??= new PrismaClient({ log: process.env.NODE_ENV === "production" ? ["error"] : ["error", "warn"] }));

const toDbType = (t: ApplicationType) => t.toUpperCase() as DbAppType;
const fromDbType = (t: DbAppType) => t.toLowerCase() as ApplicationType;

/** Atomic counter for human-readable ids. */
async function nextCounter(tx: Prisma.TransactionClient, key: string) {
  const c = await tx.counter.upsert({ where: { key }, create: { key, value: 1 }, update: { value: { increment: 1 } } });
  return c.value;
}

const userInclude = { profile: true } as const;
type DbUser = Prisma.UserGetPayload<{ include: typeof userInclude }>;
const toUser = (u: DbUser): UserRecord => ({
  id: u.id,
  discordId: u.discordId,
  username: u.profile?.username ?? "unknown",
  displayName: u.profile?.displayName ?? null,
  avatar: u.profile?.avatar ?? null,
  accountCreatedAt: u.profile?.accountCreatedAt?.toISOString() ?? null,
  inGuild: u.profile?.inGuild ?? false,
  roleIds: u.profile?.roleIds ?? [],
  rolesCheckedAt: u.profile?.rolesCheckedAt?.toISOString() ?? null,
  createdAt: u.createdAt.toISOString(),
  lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
  isBanned: u.isBanned,
});

const appInclude = {
  user: { include: userInclude },
  assignedTo: { include: userInclude },
  answers: true,
  reviews: { include: { reviewer: { include: userInclude } }, orderBy: { createdAt: "desc" } },
} satisfies Prisma.ApplicationInclude;
type DbApp = Prisma.ApplicationGetPayload<{ include: typeof appInclude }>;
const toApp = (a: DbApp): ApplicationView => ({
  id: a.id,
  publicId: a.publicId,
  type: fromDbType(a.type),
  status: a.status,
  characterName: a.characterName,
  applicant: {
    id: a.user.id,
    discordId: a.user.discordId,
    username: a.user.profile?.username ?? "unknown",
    displayName: a.user.profile?.displayName ?? null,
    avatarUrl: avatarUrl(a.user.discordId, a.user.profile?.avatar ?? null),
  },
  assignedTo: a.assignedTo ? { id: a.assignedTo.id, username: a.assignedTo.profile?.username ?? "staff" } : null,
  answers: a.answers.map((x) => ({ key: x.questionKey, question: x.question, answer: x.answer })),
  reviews: a.reviews.map((r) => ({
    id: r.id,
    reviewerName: r.reviewer.profile?.username ?? "staff",
    fromStatus: r.fromStatus,
    toStatus: r.toStatus,
    note: r.note,
    internal: r.internal,
    createdAt: r.createdAt.toISOString(),
  })),
  quiz: a.quizScore != null && a.quizTotal != null ? { score: a.quizScore, total: a.quizTotal } : null,
  roleSyncError: a.roleSyncError,
  createdAt: a.createdAt.toISOString(),
  updatedAt: a.updatedAt.toISOString(),
});

const ticketInclude = { user: { include: userInclude }, assignedTo: { include: userInclude }, playerReport: true, banAppeal: true, bugReport: true } satisfies Prisma.SupportTicketInclude;
type DbTicket = Prisma.SupportTicketGetPayload<{ include: typeof ticketInclude }>;
const toTicket = (t: DbTicket): TicketView => {
  const details: Record<string, string> = {};
  const add = (o: Record<string, unknown> | null) => o && Object.entries(o).forEach(([k, v]) => !["id", "ticketId"].includes(k) && v && (details[k] = String(v)));
  add(t.playerReport);
  add(t.banAppeal);
  add(t.bugReport);
  return {
    id: t.id,
    publicId: t.publicId,
    type: t.type,
    status: t.status,
    subject: t.subject,
    body: t.body,
    details,
    author: { id: t.user.id, username: t.user.profile?.username ?? "unknown", discordId: t.user.discordId },
    assignedTo: t.assignedTo ? { id: t.assignedTo.id, username: t.assignedTo.profile?.username ?? "staff" } : null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
};

const toAdmin = (r: { discordId: string; accessLevel: string; permissions: string[]; addedBy: string; active: boolean; createdAt: Date }): AdminAccessRecord => ({
  discordId: r.discordId,
  accessLevel: r.accessLevel,
  permissions: r.permissions as AdminPermission[],
  addedBy: r.addedBy,
  active: r.active,
  createdAt: r.createdAt.toISOString(),
});

type DbAttempt = Prisma.WhitelistQuizAttemptGetPayload<object>;
const toAttempt = (r: DbAttempt): QuizAttemptRecord => ({
  id: r.id,
  userId: r.userId,
  questionIds: r.questionIds,
  optionMap: r.optionMap as QuizAttemptRecord["optionMap"],
  score: r.score,
  passed: r.passed,
  startedAt: r.startedAt.toISOString(),
  completedAt: r.completedAt?.toISOString() ?? null,
  failedAt: r.failedAt?.toISOString() ?? null,
  nextEligibleAttemptAt: r.nextEligibleAttemptAt?.toISOString() ?? null,
  usedAt: r.usedAt?.toISOString() ?? null,
});

class ActiveExists extends Error {}

export const prismaStore: Store = {
  kind: "prisma",

  async upsertUser(u) {
    const profile = { username: u.username, displayName: u.displayName, avatar: u.avatar, accountCreatedAt: u.accountCreatedAt ? new Date(u.accountCreatedAt) : null };
    const rec = await prisma.user.upsert({
      where: { discordId: u.discordId },
      create: { discordId: u.discordId, lastLoginAt: new Date(), profile: { create: profile } },
      update: { lastLoginAt: new Date(), profile: { upsert: { create: profile, update: profile } } },
      include: userInclude,
    });
    return toUser(rec);
  },
  async updateUserGuild(userId, data) {
    await prisma.discordProfile.update({ where: { userId }, data: { inGuild: data.inGuild, roleIds: data.roleIds, rolesCheckedAt: new Date() } });
  },
  async getUser(id) {
    const u = await prisma.user.findUnique({ where: { id }, include: userInclude });
    return u ? toUser(u) : null;
  },
  async getUserByDiscordId(discordId) {
    const u = await prisma.user.findUnique({ where: { discordId }, include: userInclude });
    return u ? toUser(u) : null;
  },
  async listUsers(q, take = 100) {
    const users = await prisma.user.findMany({
      where: q ? { OR: [{ discordId: { contains: q } }, { profile: { username: { contains: q, mode: "insensitive" } } }] } : undefined,
      include: userInclude,
      orderBy: { createdAt: "desc" },
      take,
    });
    return users.map(toUser);
  },
  countUsers: () => prisma.user.count(),

  async createApplication(a) {
    const rec = await prisma.$transaction(async (tx) => {
      const n = await nextCounter(tx, `app:${a.type}`);
      return tx.application.create({
        data: {
          publicId: applicationPublicId(a.type, n),
          type: toDbType(a.type),
          userId: a.userId,
          characterName: a.characterName,
          quizAttemptId: a.quiz?.attemptId,
          quizScore: a.quiz?.score,
          quizTotal: a.quiz?.total,
          answers: { create: a.answers.map((x) => ({ questionKey: x.key, question: x.question, answer: x.answer })) },
        },
        include: appInclude,
      });
    });
    return toApp(rec);
  },
  async getApplication(id) {
    const a = await prisma.application.findFirst({ where: { OR: [{ id }, { publicId: id }] }, include: appInclude });
    return a ? toApp(a) : null;
  },
  async listApplications(f) {
    const apps = await prisma.application.findMany({
      where: {
        type: f.type ? toDbType(f.type) : undefined,
        status: f.status,
        OR: f.q
          ? [
              { publicId: { contains: f.q, mode: "insensitive" } },
              { characterName: { contains: f.q, mode: "insensitive" } },
              { user: { profile: { username: { contains: f.q, mode: "insensitive" } } } },
            ]
          : undefined,
      },
      include: appInclude,
      orderBy: { createdAt: "desc" },
      take: f.take ?? 100,
    });
    return apps.map(toApp);
  },
  async listUserApplications(userId) {
    const apps = await prisma.application.findMany({ where: { userId }, include: appInclude, orderBy: { createdAt: "desc" } });
    return apps.map(toApp);
  },
  async setApplicationStatus(id, status, reviewerId, note, internal = true) {
    const cur = await prisma.application.findUnique({ where: { id } });
    if (!cur) return null;
    const a = await prisma.application.update({
      where: { id },
      data: {
        status,
        decidedAt: ["ACCEPTED", "REJECTED", "CLOSED"].includes(status) ? new Date() : null,
        reviews: { create: { reviewerId, fromStatus: cur.status, toStatus: status, note, internal } },
      },
      include: appInclude,
    });
    return toApp(a);
  },
  async addApplicationNote(id, authorId, note, internal = true) {
    await prisma.applicationReview.create({ data: { applicationId: id, reviewerId: authorId, note, internal } });
    await prisma.application.update({ where: { id }, data: { updatedAt: new Date() } });
    return this.getApplication(id);
  },
  async setApplicationRoleSync(id, error) {
    await prisma.application.update({ where: { id }, data: { roleSyncError: error } });
  },
  async assignApplication(id, reviewerId, actorId) {
    await prisma.application.update({ where: { id }, data: { assignedToId: reviewerId } });
    await prisma.applicationReview.create({ data: { applicationId: id, reviewerId: actorId, note: reviewerId ? "Reviewer assigned" : "Unassigned" } });
    return this.getApplication(id);
  },
  countApplications: (status) => prisma.application.count({ where: status ? { status: { in: status } } : undefined }),

  async createTicket(t) {
    const rec = await prisma.$transaction(async (tx) => {
      const n = await nextCounter(tx, "ticket");
      const d = t.details;
      return tx.supportTicket.create({
        data: {
          publicId: ticketPublicId(n),
          type: t.type,
          subject: t.subject,
          body: t.body,
          userId: t.userId,
          playerReport: t.type === "PLAYER_REPORT" ? { create: { reportedPlayer: d.reportedPlayer ?? "", incidentAt: d.incidentAt, evidenceUrl: d.evidenceUrl } } : undefined,
          banAppeal: t.type === "BAN_APPEAL" ? { create: { banReason: d.banReason, bannedBy: d.bannedBy, bannedAt: d.bannedAt } } : undefined,
          bugReport: t.type === "BUG_REPORT" ? { create: { steps: d.steps, severity: d.severity, evidenceUrl: d.evidenceUrl } } : undefined,
        },
        include: ticketInclude,
      });
    });
    return toTicket(rec);
  },
  async getTicket(id) {
    const t = await prisma.supportTicket.findFirst({ where: { OR: [{ id }, { publicId: id }] }, include: ticketInclude });
    return t ? toTicket(t) : null;
  },
  async listTickets(f) {
    const ts = await prisma.supportTicket.findMany({
      where: {
        type: f.type,
        status: f.status,
        OR: f.q ? [{ publicId: { contains: f.q, mode: "insensitive" } }, { subject: { contains: f.q, mode: "insensitive" } }] : undefined,
      },
      include: ticketInclude,
      orderBy: { createdAt: "desc" },
      take: f.take ?? 100,
    });
    return ts.map(toTicket);
  },
  async listUserTickets(userId) {
    const ts = await prisma.supportTicket.findMany({ where: { userId }, include: ticketInclude, orderBy: { createdAt: "desc" } });
    return ts.map(toTicket);
  },
  async setTicketStatus(id, status, assignedToId) {
    const t = await prisma.supportTicket.update({ where: { id }, data: { status, ...(assignedToId !== undefined ? { assignedToId } : {}) }, include: ticketInclude }).catch(() => null);
    return t ? toTicket(t) : null;
  },
  countTickets: (status) => prisma.supportTicket.count({ where: status ? { status: { in: status } } : undefined }),

  async listAdminAccess() {
    const rows = await prisma.adminAccess.findMany({ orderBy: { createdAt: "asc" } });
    return rows.map(toAdmin);
  },
  async getAdminAccess(discordId) {
    const r = await prisma.adminAccess.findUnique({ where: { discordId } });
    return r ? toAdmin(r) : null;
  },
  async upsertAdminAccess(a) {
    const data = { accessLevel: a.accessLevel, permissions: a.permissions, addedBy: a.addedBy, active: a.active };
    return toAdmin(await prisma.adminAccess.upsert({ where: { discordId: a.discordId }, create: { discordId: a.discordId, ...data }, update: data }));
  },

  async createQuizAttempt(a) {
    return toAttempt(await prisma.whitelistQuizAttempt.create({ data: { userId: a.userId, questionIds: a.questionIds, optionMap: a.optionMap as Prisma.InputJsonValue } }));
  },
  async getQuizAttempt(id) {
    const r = await prisma.whitelistQuizAttempt.findUnique({ where: { id } });
    return r ? toAttempt(r) : null;
  },
  async completeQuizAttempt(id, score, passed, nextEligibleAttemptAt) {
    const at = new Date();
    const fail = passed ? {} : { failedAt: at, nextEligibleAttemptAt: nextEligibleAttemptAt ? new Date(nextEligibleAttemptAt) : null };
    const { count } = await prisma.whitelistQuizAttempt.updateMany({ where: { id, completedAt: null }, data: { score, passed, completedAt: at, ...fail } });
    return count ? this.getQuizAttempt(id) : null;
  },
  async createWhitelistApplication(a) {
    try {
      // Serializable: two concurrent submits for the same user cannot both see "no active application".
      return await prisma.$transaction(
        async (tx) => {
          const used = await tx.whitelistQuizAttempt.updateMany({ where: { id: a.quiz.attemptId, userId: a.userId, passed: true, usedAt: null }, data: { usedAt: new Date() } });
          if (used.count !== 1) return { ok: false as const, reason: "ATTEMPT_USED" as const };
          const active = await tx.application.findFirst({ where: { userId: a.userId, type: "WHITELIST", status: { in: [...ACTIVE_APPLICATION_STATUSES] } }, select: { id: true } });
          if (active) throw new ActiveExists(); // rolls the attempt back to unused
          const n = await nextCounter(tx, "app:whitelist");
          const rec = await tx.application.create({
            data: {
              publicId: applicationPublicId("whitelist", n),
              type: "WHITELIST",
              userId: a.userId,
              characterName: a.characterName,
              quizAttemptId: a.quiz.attemptId,
              quizScore: a.quiz.score,
              quizTotal: a.quiz.total,
              answers: { create: a.answers.map((x) => ({ questionKey: x.key, question: x.question, answer: x.answer })) },
            },
            include: appInclude,
          });
          return { ok: true as const, app: toApp(rec) };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (e) {
      if (e instanceof ActiveExists) return { ok: false, reason: "ACTIVE_EXISTS" };
      // P2034 = serialization conflict, P2002 = unique quizAttemptId → a parallel submit won
      if (e instanceof Prisma.PrismaClientKnownRequestError && (e.code === "P2034" || e.code === "P2002")) return { ok: false, reason: "ACTIVE_EXISTS" };
      throw e;
    }
  },
  async listQuizAttempts(userId) {
    const rows = await prisma.whitelistQuizAttempt.findMany({ where: userId ? { userId } : undefined, orderBy: { startedAt: "desc" }, take: 5000 });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return rows.map(toAttempt).map(({ optionMap, ...rest }) => rest);
  },

  async createNotifications(list) {
    if (list.length) await prisma.notification.createMany({ data: list.map((n) => ({ discordId: n.discordId, kind: n.kind, title: n.title, body: n.body, href: n.href ?? null })) });
  },
  async listNotifications(discordId, take = 30) {
    const rows = await prisma.notification.findMany({ where: { discordId }, orderBy: { createdAt: "desc" }, take });
    return rows.map((n) => ({ id: n.id, kind: n.kind, title: n.title, body: n.body, href: n.href, readAt: n.readAt?.toISOString() ?? null, createdAt: n.createdAt.toISOString() }));
  },
  async markNotificationsRead(discordId, ids) {
    await prisma.notification.updateMany({ where: { discordId, readAt: null, ...(ids ? { id: { in: ids } } : {}) }, data: { readAt: new Date() } });
  },
  async savePushSubscription(sub) {
    await prisma.pushSubscription.upsert({ where: { endpoint: sub.endpoint }, create: sub, update: { discordId: sub.discordId, p256dh: sub.p256dh, auth: sub.auth } });
  },
  async listPushSubscriptions(discordIds) {
    const rows = await prisma.pushSubscription.findMany({ where: { discordId: { in: discordIds } } });
    return rows.map(({ discordId, endpoint, p256dh, auth }) => ({ discordId, endpoint, p256dh, auth }));
  },
  async deletePushSubscription(endpoint) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint } });
  },

  async createAuditLog(l) {
    await prisma.auditLog.create({
      data: { category: l.category, action: l.action, actorId: l.actorId ?? null, targetId: l.targetId ?? null, ip: l.ip ?? null, metadata: (l.metadata ?? undefined) as Prisma.InputJsonValue | undefined },
    });
  },
  async listAuditLogs(category?: LogCategory, take = 100) {
    const logs = await prisma.auditLog.findMany({ where: { category }, include: { actor: { include: userInclude } }, orderBy: { createdAt: "desc" }, take });
    return logs.map(
      (l): AuditLogView => ({
        id: l.id,
        category: l.category,
        action: l.action,
        actor: l.actor ? { discordId: l.actor.discordId, username: l.actor.profile?.username ?? "unknown" } : null,
        targetId: l.targetId,
        metadata: (l.metadata as Record<string, unknown> | null) ?? null,
        createdAt: l.createdAt.toISOString(),
      }),
    );
  },
};
