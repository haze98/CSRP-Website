import "server-only";
import { randomBytes, randomInt } from "node:crypto";
import { whyJoin } from "@/config/applications";
import { serverConfig } from "@/config/server.config";
import { env, integrations } from "@/lib/env";
import { sanitizeText } from "@/lib/security";
import { requireStore } from "@/lib/store";
import type { UserRecord } from "@/lib/store/types";
import { z } from "zod";
import { fieldErrors } from "@/lib/validation";
import { QUIZ_PASS_MARK, QUIZ_SIZE, questionById, whitelistQuestions } from "@/server/whitelist-questions";
import { ACTIVE_APPLICATION_STATUSES, type AdminAccessView, type AdminPermission, type ApplicationView, type PublicQuiz, type QuizAttemptView, type SessionUser, type WhitelistState } from "@/types";
import { AdminService } from "./admin.service";
import { ServiceError } from "./application.service";
import { DiscordService } from "./discord.service";
import { LoggingService } from "./logging.service";
import { NotificationService } from "./notification.service";

const ATTEMPT_TTL_MS = 60 * 60_000; // an unfinished quiz expires after 1h
const PASSED_TTL_MS = 24 * 3600_000; // a passed quiz must be used within 24h

/** Server-side validation of the final whitelist submission. */
const submitSchema = z.object({
  attemptId: z.string({ error: "Complete the rule assessment first." }).min(1).max(64),
  whyJoin: z
    .string({ error: "Tell us why you want to join." })
    .trim()
    .min(serverConfig.whitelist.whyMin, `Please write at least ${serverConfig.whitelist.whyMin} characters.`)
    .max(serverConfig.whitelist.whyMax, `Please keep this under ${serverConfig.whitelist.whyMax} characters.`),
  agree: z.literal(true, { error: "Required" }),
});

const token = () => randomBytes(9).toString("base64url");
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const siteUrl = () => serverConfig.siteUrl.replace(/\/$/, "");
const nameOf = (u: { displayName?: string | null; username: string }) => u.displayName || u.username;

/** Whitelist state for one user from their whitelist applications + quiz attempts. */
export function computeState(apps: ApplicationView[], attempts: QuizAttemptView[], user?: Pick<UserRecord, "roleIds" | "rolesCheckedAt"> | null): WhitelistState {
  const app = apps.filter((a) => a.type === "whitelist").sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))[0];
  const latest = attempts[0];
  if (app?.status === "ACCEPTED") {
    const roleId = serverConfig.discordRoles.whitelist;
    const missingRole = integrations.discordBot && roleId && user?.rolesCheckedAt && !user.roleIds.includes(roleId);
    return app.roleSyncError || missingRole ? "SYNC_ERROR" : "APPROVED";
  }
  if (app && ACTIVE_APPLICATION_STATUSES.includes(app.status)) return "PENDING_REVIEW";
  // newer quiz activity after a rejection counts as a fresh attempt
  const appTime = app ? +new Date(app.updatedAt) : 0;
  if (latest && +new Date(latest.startedAt) > appTime) {
    if (!latest.completedAt) return Date.now() - +new Date(latest.startedAt) < ATTEMPT_TTL_MS ? "QUIZ_IN_PROGRESS" : app ? "REJECTED" : "NOT_STARTED";
    if (latest.passed && !latest.usedAt) return "QUIZ_PASSED_INCOMPLETE";
    if (!latest.passed) return "QUIZ_FAILED";
  }
  if (app && (app.status === "REJECTED" || app.status === "CLOSED")) return "REJECTED";
  return "NOT_STARTED";
}

/**
 * When this user may generate their next quiz, or null if they may now.
 * Uses the server clock only: nextEligibleAttemptAt is fixed when a failed
 * attempt is graded, so refreshing, new browsers, local storage, the
 * browser clock or direct API calls can't move it.
 */
export function nextEligibleAt(attempts: QuizAttemptView[], now = Date.now()): Date | null {
  const cooldownMs = env.whitelistRetryCooldownMinutes * 60_000;
  let until = 0;
  for (const a of attempts) {
    if (!a.completedAt || a.passed) continue;
    // rows graded before nextEligibleAttemptAt existed fall back to completedAt + cooldown
    const t = a.nextEligibleAttemptAt ? +new Date(a.nextEligibleAttemptAt) : +new Date(a.failedAt ?? a.completedAt) + cooldownMs;
    if (t > until) until = t;
  }
  return until > now ? new Date(until) : null;
}

/** Latest passed attempt that can still be turned into an application. */
const usablePass = (attempts: QuizAttemptView[]) => attempts.find((a) => a.passed && a.completedAt && !a.usedAt && Date.now() - +new Date(a.completedAt) < PASSED_TTL_MS) ?? null;

/** Permission each review action needs (on top of whitelist.view to reach the API). */
const REVIEW_PERM = {
  approve: "whitelist.approve",
  retry_sync: "whitelist.approve",
  reject: "whitelist.reject",
  request_info: "whitelist.reject",
  reply: "whitelist.view",
  note: "whitelist.view",
} as const satisfies Record<string, AdminPermission>;

export const WhitelistService = {
  passMark: QUIZ_PASS_MARK,
  size: QUIZ_SIZE,

  /** Player's own whitelist overview (dashboard + flow gating). */
  async getMyState(user: SessionUser) {
    const store = await requireStore();
    const [apps, attempts, rec] = await Promise.all([store.listUserApplications(user.id), store.listQuizAttempts(user.id), store.getUser(user.id)]);
    const wl = apps.filter((a) => a.type === "whitelist");
    const state = computeState(wl, attempts, rec);
    const retry = nextEligibleAt(attempts);
    const pass = state === "QUIZ_PASSED_INCOMPLETE" ? usablePass(attempts) : null;
    const lastFailed = attempts.find((a) => a.completedAt && !a.passed);
    return {
      state,
      application: wl[0] ?? null,
      attempts: attempts.length,
      retryAt: retry?.toISOString() ?? null,
      /** Server clock, so the browser can correct its countdown for clock skew. */
      serverTime: new Date().toISOString(),
      /** The player's own passed attempt, so a refresh can resume the written step. */
      passed: pass ? { attemptId: pass.id, score: pass.score ?? 0, total: pass.questionIds.length } : null,
      lastFailed: lastFailed && retry ? { score: lastFailed.score ?? 0, total: lastFailed.questionIds.length } : null,
      open: serverConfig.applications.whitelist.open,
    };
  },

  /** Start a quiz: 5 random questions, options shuffled with random tokens. No correctness leaves the server. */
  async startQuiz(user: SessionUser): Promise<PublicQuiz> {
    if (!serverConfig.applications.whitelist.open) throw new ServiceError("Whitelist applications are currently closed.", 409);
    const store = await requireStore();
    const me = await this.getMyState(user);
    if (me.state === "PENDING_REVIEW") throw new ServiceError("Your whitelist application is already waiting for staff review.", 409);
    if (me.state === "APPROVED" || me.state === "SYNC_ERROR") throw new ServiceError("You're already whitelisted.", 409);
    if (me.passed) throw new ServiceError("You've already passed the assessment. Finish your written answer to submit.", 409);
    // Cooldown: server time must be >= nextEligibleAttemptAt before a new quiz is generated.
    if (me.retryAt) {
      await LoggingService.log({ category: "SECURITY", action: "WHITELIST_COOLDOWN_BLOCKED", actor: user, metadata: { nextEligibleAttemptAt: me.retryAt } });
      throw new ServiceError(`You can take the assessment again at ${new Date(me.retryAt).toLocaleTimeString("en-GB", { timeZone: "Asia/Kathmandu", hour: "2-digit", minute: "2-digit" })} NPT.`, 429);
    }

    // prefer questions the player didn't see last time
    const prev = (await store.listQuizAttempts(user.id))[0]?.questionIds ?? [];
    const fresh = whitelistQuestions.filter((q) => !prev.includes(q.id));
    const pool = fresh.length >= QUIZ_SIZE ? fresh : whitelistQuestions;
    const picked = shuffle(pool).slice(0, QUIZ_SIZE);

    const optionMap: Record<string, Record<string, number>> = {};
    const questions = picked.map((q) => {
      const order = shuffle([0, 1, 2, 3]);
      optionMap[q.id] = {};
      return {
        id: q.id,
        text: q.text,
        options: order.map((idx) => {
          const t = token();
          optionMap[q.id][t] = idx;
          return { id: t, text: q.options[idx] };
        }),
      };
    });
    const attempt = await store.createQuizAttempt({ userId: user.id, questionIds: picked.map((q) => q.id), optionMap });
    await LoggingService.log({ category: "WHITELIST", action: "WHITELIST_QUIZ_STARTED", actor: user, targetId: attempt.id, metadata: { questions: attempt.questionIds.length } });
    return { attemptId: attempt.id, questions, passMark: QUIZ_PASS_MARK };
  },

  /** Grade server-side. Only score/pass are returned — never which answers were right. */
  async submitQuiz(user: SessionUser, attemptId: string, answers: Record<string, string>) {
    const store = await requireStore();
    const attempt = await store.getQuizAttempt(attemptId);
    if (!attempt || attempt.userId !== user.id) throw new ServiceError("Assessment not found. Please start again.", 404);
    if (attempt.completedAt) throw new ServiceError("This assessment was already submitted.", 409);
    if (Date.now() - +new Date(attempt.startedAt) > ATTEMPT_TTL_MS) throw new ServiceError("This assessment expired. Please start a new one.", 410);
    // Only the newest attempt counts, and never during a cooldown, so opening
    // several quizzes in parallel can't buy extra tries after a failure.
    const attempts = await store.listQuizAttempts(user.id);
    if (attempts[0]?.id !== attempt.id) throw new ServiceError("A newer assessment was started. Please use that one.", 409);
    if (nextEligibleAt(attempts)) throw new ServiceError("Your retry cooldown is still running.", 429);

    const keys = Object.keys(answers ?? {});
    if (keys.length !== attempt.questionIds.length || !attempt.questionIds.every((q) => typeof answers[q] === "string" && answers[q] in (attempt.optionMap[q] ?? {}))) {
      throw new ServiceError("Please answer every question.", 422);
    }
    let score = 0;
    for (const qid of attempt.questionIds) {
      const q = questionById(qid);
      if (q && attempt.optionMap[qid][answers[qid]] === q.correct) score++;
    }
    const passed = score >= QUIZ_PASS_MARK;
    const cooldownMs = env.whitelistRetryCooldownMinutes * 60_000;
    const nextAt = passed || !cooldownMs ? null : new Date(Date.now() + cooldownMs).toISOString();
    const done = await store.completeQuizAttempt(attempt.id, score, passed, nextAt);
    if (!done) throw new ServiceError("This assessment was already submitted.", 409);

    await LoggingService.log({
      category: "WHITELIST",
      action: passed ? "WHITELIST_QUIZ_PASSED" : "WHITELIST_QUIZ_FAILED",
      actor: user,
      targetId: attempt.id,
      fields: [{ name: "Score", value: `${score} / ${attempt.questionIds.length}`, inline: true }, ...(nextAt ? [{ name: "Next attempt", value: `<t:${Math.floor(+new Date(nextAt) / 1000)}:R>`, inline: true }] : [])],
    });
    return { score, total: attempt.questionIds.length, passed, retryAt: nextAt, serverTime: new Date().toISOString() };
  },

  /** Final submission: requires a passed, unused, recent attempt owned by the user. */
  async submitApplication(user: SessionUser, body: { attemptId?: unknown; whyJoin?: unknown; agree?: unknown }) {
    if (!serverConfig.applications.whitelist.open) throw new ServiceError("Whitelist applications are currently closed.", 409);
    const input = submitSchema.safeParse(body);
    if (!input.success) {
      const f = fieldErrors(input.error);
      throw new ServiceError(f.agree ? "Please confirm you have read and agree to follow the CSRP rules." : (f.whyJoin ?? "Please check your application and try again."), 422, f);
    }

    const store = await requireStore();
    const attempt = await store.getQuizAttempt(input.data.attemptId);
    if (!attempt || attempt.userId !== user.id || !attempt.completedAt) throw new ServiceError("Complete the rule assessment first.", 409);
    if (!attempt.passed) throw new ServiceError("The rule assessment was not passed.", 409);
    if (attempt.usedAt) throw new ServiceError("This assessment was already used for an application.", 409);
    if (Date.now() - +new Date(attempt.completedAt) > PASSED_TTL_MS) throw new ServiceError("Your assessment result expired. Please take it again.", 410);

    const me = await this.getMyState(user);
    if (me.state === "APPROVED" || me.state === "SYNC_ERROR") throw new ServiceError("You're already whitelisted.", 409);

    const total = attempt.questionIds.length;
    // One transaction: consume the attempt + duplicate check + insert. Nothing
    // is written if any part fails, so the player can simply retry.
    const res = await store.createWhitelistApplication({
      type: "whitelist",
      userId: user.id,
      characterName: null,
      answers: [{ key: whyJoin.key, question: whyJoin.label, answer: sanitizeText(input.data.whyJoin, serverConfig.whitelist.whyMax) }],
      quiz: { attemptId: attempt.id, score: attempt.score ?? 0, total },
    });
    if (!res.ok) {
      throw res.reason === "ACTIVE_EXISTS"
        ? new ServiceError("You already have a whitelist application waiting for review.", 409)
        : new ServiceError("This assessment was already used for an application.", 409);
    }
    const app = res.app;

    const reviewUrl = `/admin/whitelist/${app.id}`;
    const name = nameOf(user);
    // Side effects must never undo a stored application: failures are logged only.
    await NotificationService.notify({
      discordIds: await AdminService.recipients("whitelist.view"),
      kind: "whitelist",
      title: "New whitelist application",
      body: `${name} has submitted a whitelist application. Score ${attempt.score} / ${total}.`,
      href: reviewUrl,
      push: true,
    }).catch((e) => console.error("[whitelist] admin notification failed", e));
    await LoggingService.log({
      category: "WHITELIST",
      action: "WHITELIST_APPLICATION_SUBMITTED",
      title: "CSRP • WHITELIST APPLICATION",
      actor: user,
      targetId: app.publicId,
      fields: [
        { name: "Quiz", value: "PASSED", inline: true },
        { name: "Score", value: `${attempt.score} / ${total}`, inline: true },
        { name: "Application ID", value: app.publicId, inline: true },
        { name: "Submitted", value: `<t:${Math.floor(Date.now() / 1000)}:F>` },
        { name: "Review", value: `${siteUrl()}${reviewUrl}` },
      ],
    }).catch((e) => console.error("[whitelist] audit log failed", e));
    return app;
  },

  /** Applicant answers a "request more information". */
  async applicantReply(user: SessionUser, appId: string, message: string) {
    const store = await requireStore();
    const app = await store.getApplication(appId);
    if (!app || app.applicant.id !== user.id) throw new ServiceError("Application not found.", 404);
    if (app.status !== "INFO_REQUESTED") throw new ServiceError("Staff haven't asked for more information on this application.", 409);
    const text = sanitizeText(message, 1500);
    if (text.length < 10) throw new ServiceError("Please write at least 10 characters.", 422, { message: "Too short" });
    await store.addApplicationNote(app.id, user.id, `Applicant reply: ${text}`, false);
    const updated = await store.setApplicationStatus(app.id, "SUBMITTED", user.id, null, false);
    await NotificationService.notify({ discordIds: await AdminService.recipients("whitelist.view"), kind: "whitelist", title: "Applicant replied", body: `${nameOf(user)} replied to your information request on ${app.publicId}.`, href: `/admin/whitelist/${app.id}`, push: true });
    await LoggingService.log({ category: "WHITELIST", action: "WHITELIST_APPLICANT_REPLIED", actor: user, targetId: app.publicId });
    return updated;
  },

  /* ------------------------------------------------------- admin review */

  async review(
    admin: SessionUser,
    access: AdminAccessView,
    appId: string,
    action: "approve" | "reject" | "request_info" | "reply" | "note" | "retry_sync",
    opts: { message?: string; dm?: boolean; push?: boolean },
  ) {
    // Each action needs its own permission, checked against freshly loaded access
    // (revoking an admin takes effect on their very next action).
    const fresh = await AdminService.getAccess(admin.discordId, { fresh: true });
    if (!fresh || fresh.discordId !== access.discordId || !AdminService.can(fresh, REVIEW_PERM[action])) throw new ServiceError("You don't have permission to do that.", 403);
    const store = await requireStore();
    const app = await store.getApplication(appId);
    if (!app || app.type !== "whitelist") throw new ServiceError("Whitelist application not found.", 404);
    const msg = opts.message ? sanitizeText(opts.message, 1500) : "";
    const applicantId = app.applicant.discordId;
    const tell = async (title: string, body: string, href = "/account#whitelist") => {
      await NotificationService.notify({ discordIds: [applicantId], kind: "whitelist", title, body, href, push: opts.push });
      if (opts.dm && DiscordService.configured()) {
        await DiscordService.dmUser(applicantId, { embeds: [{ title: `${serverConfig.shortName} — ${title}`, description: body, color: 0xdc143c, timestamp: new Date().toISOString() }] }).catch(() => false);
      }
    };

    switch (action) {
      case "approve": {
        if (app.status === "ACCEPTED") throw new ServiceError("Already approved.", 409);
        await store.setApplicationStatus(app.id, "ACCEPTED", admin.id, msg || "Welcome to Chandra Surya Roleplay.", false);
        const sync = await this.syncRole(app.id, applicantId);
        await LoggingService.log({
          category: "WHITELIST",
          action: "WHITELIST_APPROVED",
          title: "CSRP • WHITELIST APPROVED",
          actor: admin,
          targetId: app.publicId,
          previous: { status: app.status },
          next: { status: "ACCEPTED", roleSync: sync.ok ? "granted" : sync.error },
          fields: [
            { name: "Applicant", value: `<@${applicantId}> · ${app.applicant.username}`, inline: true },
            { name: "Discord role", value: sync.ok ? "Granted" : `Not granted — ${sync.error}`, inline: true },
          ],
        });
        await tell("Whitelist approved", "Welcome to Chandra Surya Roleplay. Your whitelist has been approved — enter the city!", "/account#whitelist");
        break;
      }
      case "reject": {
        if (msg.length < 5) throw new ServiceError("Please give the applicant a reason.", 422, { message: "Required" });
        await store.setApplicationStatus(app.id, "REJECTED", admin.id, msg, false);
        await LoggingService.log({ category: "WHITELIST", action: "WHITELIST_REJECTED", actor: admin, targetId: app.publicId, previous: { status: app.status }, next: { status: "REJECTED" }, fields: [{ name: "Applicant", value: `<@${applicantId}>`, inline: true }] });
        await tell("Whitelist not approved", msg);
        break;
      }
      case "request_info": {
        if (msg.length < 5) throw new ServiceError("Tell the applicant what information you need.", 422, { message: "Required" });
        await store.setApplicationStatus(app.id, "INFO_REQUESTED", admin.id, msg, false);
        await LoggingService.log({ category: "WHITELIST", action: "WHITELIST_INFO_REQUESTED", actor: admin, targetId: app.publicId, previous: { status: app.status }, next: { status: "INFO_REQUESTED" } });
        await tell("More information requested", msg);
        break;
      }
      case "reply": {
        if (msg.length < 2) throw new ServiceError("Write a reply first.", 422, { message: "Required" });
        await store.addApplicationNote(app.id, admin.id, msg, false);
        await LoggingService.log({ category: "WHITELIST", action: "WHITELIST_REPLY_SENT", actor: admin, targetId: app.publicId });
        await tell("New message from CSRP staff", msg);
        break;
      }
      case "note": {
        if (msg.length < 2) throw new ServiceError("Write a note first.", 422, { message: "Required" });
        await store.addApplicationNote(app.id, admin.id, msg, true); // internal — never shown to the applicant
        await LoggingService.log({ category: "STAFF", action: "WHITELIST_NOTE_ADDED", actor: admin, targetId: app.publicId });
        break;
      }
      case "retry_sync": {
        if (app.status !== "ACCEPTED") throw new ServiceError("Only approved whitelists have a Discord role to sync.", 409);
        const sync = await this.syncRole(app.id, applicantId);
        await LoggingService.log({ category: "WHITELIST", action: sync.ok ? "WHITELIST_ROLE_SYNCED" : "WHITELIST_ROLE_SYNC_FAILED", actor: admin, targetId: app.publicId, fields: sync.ok ? [] : [{ name: "Error", value: sync.error }] });
        if (!sync.ok) throw new ServiceError(`Role sync failed: ${sync.error}`, 502);
        break;
      }
    }
    return store.getApplication(app.id);
  },

  /** Grant the configured whitelist role (server-side bot). Records failures for SYNC_ERROR. */
  async syncRole(appId: string, discordId: string) {
    const store = await requireStore();
    const res = await DiscordService.addMemberRole(discordId, serverConfig.discordRoles.whitelist);
    // In development without a bot there's nothing to sync — don't flag an error.
    const skip = !res.ok && !integrations.discordBot && !env.isProd;
    await store.setApplicationRoleSync(appId, res.ok || skip ? null : res.error);
    return res.ok || skip ? ({ ok: true } as const) : res;
  },

  /** Admin table rows: every registered user with their computed whitelist state. */
  async listStates() {
    const store = await requireStore();
    const [users, apps, attempts] = await Promise.all([store.listUsers(undefined, 5000), store.listApplications({ type: "whitelist", take: 5000 }), store.listQuizAttempts()]);
    return users.map((u) => {
      const ua = apps.filter((a) => a.applicant.id === u.id);
      const ut = attempts.filter((t) => t.userId === u.id);
      const app = ua[0] ?? null;
      return {
        user: u,
        state: computeState(ua, ut, u),
        application: app,
        attempts: ut.length,
        lastActivity: [app?.updatedAt, ut[0]?.completedAt ?? ut[0]?.startedAt, u.lastLoginAt].filter(Boolean).sort().pop() ?? u.createdAt,
      };
    });
  },

  /** Reminders to selected users (or everyone not finished). Returns recipient count; dryRun only counts. */
  async remind(admin: SessionUser, access: AdminAccessView, input: { userIds?: string[]; allIncomplete?: boolean; web: boolean; push: boolean; dm: boolean; dryRun?: boolean }) {
    if (!AdminService.can(await AdminService.getAccess(admin.discordId, { fresh: true }), "notifications.send") || !AdminService.can(access, "notifications.send")) throw new ServiceError("You don't have permission to do that.", 403);
    const rows = await this.listStates();
    const incomplete: WhitelistState[] = ["NOT_STARTED", "QUIZ_IN_PROGRESS", "QUIZ_FAILED", "QUIZ_PASSED_INCOMPLETE"];
    const targets = input.allIncomplete ? rows.filter((r) => incomplete.includes(r.state)) : rows.filter((r) => input.userIds?.includes(r.user.id) && incomplete.includes(r.state));
    if (input.dryRun) return { recipients: targets.length };
    if (!targets.length) throw new ServiceError("No eligible recipients (only players who haven't completed whitelist can be reminded).", 422);
    const text = "Complete your CSRP whitelist application to continue your journey into the city.";
    const ids = targets.map((t) => t.user.discordId);
    if (input.web || input.push) await NotificationService.notify({ discordIds: ids, kind: "reminder", title: "Finish your whitelist", body: text, href: "/applications?apply=whitelist", push: input.push });
    let dms = 0;
    if (input.dm && DiscordService.configured()) {
      for (const id of ids.slice(0, 200)) if (await DiscordService.dmUser(id, { content: `${text}\n${siteUrl()}/applications?apply=whitelist` }).catch(() => false)) dms++;
    }
    await LoggingService.log({ category: "STAFF", action: "NOTIFICATION_SENT", actor: admin, metadata: { kind: "whitelist_reminder", recipients: ids.length }, fields: [{ name: "Recipients", value: String(ids.length), inline: true }, { name: "Discord DMs", value: String(dms), inline: true }] });
    return { recipients: ids.length, dms };
  },
};
