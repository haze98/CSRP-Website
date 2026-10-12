import type {
  AdminPermission,
  NotificationView,
  QuizAttemptView,
  ApplicationStatus,
  ApplicationType,
  ApplicationView,
  AuditLogView,
  LogCategory,
  TicketStatus,
  TicketType,
  TicketView,
} from "@/types";

export interface UserRecord {
  id: string;
  discordId: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
  accountCreatedAt: string | null;
  inGuild: boolean;
  roleIds: string[];
  rolesCheckedAt: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  isBanned: boolean;
}

export interface NewApplication {
  type: ApplicationType;
  userId: string;
  characterName: string | null;
  answers: { key: string; question: string; answer: string }[];
  quiz?: { attemptId: string; score: number; total: number };
}

export interface ApplicationFilter {
  type?: ApplicationType;
  status?: ApplicationStatus;
  q?: string;
  take?: number;
}

export interface NewTicket {
  type: TicketType;
  userId: string;
  subject: string;
  body: string;
  details: Record<string, string>;
}

export interface TicketFilter {
  type?: TicketType;
  status?: TicketStatus;
  q?: string;
  take?: number;
}

export interface AdminAccessRecord {
  discordId: string;
  accessLevel: string;
  permissions: AdminPermission[];
  addedBy: string;
  active: boolean;
  createdAt: string;
}

/** Server-only quiz attempt (optionMap maps random option tokens → option index). */
export interface QuizAttemptRecord extends QuizAttemptView {
  optionMap: Record<string, Record<string, number>>;
}

export interface NewNotification {
  discordId: string;
  kind: string;
  title: string;
  body: string;
  href?: string | null;
}

export interface PushSubscriptionRecord {
  discordId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface NewAuditLog {
  category: LogCategory;
  action: string;
  actorId?: string | null;
  targetId?: string | null;
  ip?: string | null;
  metadata?: Record<string, unknown>;
}

/** Persistence contract implemented by PrismaStore and MemoryStore. */
export interface Store {
  kind: "prisma" | "memory";

  upsertUser(u: { discordId: string; username: string; displayName: string | null; avatar: string | null; accountCreatedAt: string | null }): Promise<UserRecord>;
  updateUserGuild(userId: string, data: { inGuild: boolean; roleIds: string[] }): Promise<void>;
  getUser(id: string): Promise<UserRecord | null>;
  getUserByDiscordId(discordId: string): Promise<UserRecord | null>;
  listUsers(q?: string, take?: number): Promise<UserRecord[]>;
  countUsers(): Promise<number>;

  createApplication(a: NewApplication): Promise<ApplicationView>;
  getApplication(id: string): Promise<ApplicationView | null>;
  listApplications(f: ApplicationFilter): Promise<ApplicationView[]>;
  listUserApplications(userId: string): Promise<ApplicationView[]>;
  /** internal=false makes the note visible to the applicant (decision reasons, info requests). */
  setApplicationStatus(id: string, status: ApplicationStatus, reviewerId: string, note: string | null, internal?: boolean): Promise<ApplicationView | null>;
  addApplicationNote(id: string, authorId: string, note: string, internal?: boolean): Promise<ApplicationView | null>;
  setApplicationRoleSync(id: string, error: string | null): Promise<void>;
  assignApplication(id: string, reviewerId: string | null, actorId: string): Promise<ApplicationView | null>;
  countApplications(status?: ApplicationStatus[]): Promise<number>;

  createTicket(t: NewTicket): Promise<TicketView>;
  getTicket(id: string): Promise<TicketView | null>;
  listTickets(f: TicketFilter): Promise<TicketView[]>;
  listUserTickets(userId: string): Promise<TicketView[]>;
  setTicketStatus(id: string, status: TicketStatus, assignedToId?: string | null): Promise<TicketView | null>;
  countTickets(status?: TicketStatus[]): Promise<number>;

  /* website admin allowlist (manual) */
  listAdminAccess(): Promise<AdminAccessRecord[]>;
  getAdminAccess(discordId: string): Promise<AdminAccessRecord | null>;
  upsertAdminAccess(a: Omit<AdminAccessRecord, "createdAt">): Promise<AdminAccessRecord>;

  /* whitelist quiz */
  createQuizAttempt(a: { userId: string; questionIds: string[]; optionMap: QuizAttemptRecord["optionMap"] }): Promise<QuizAttemptRecord>;
  getQuizAttempt(id: string): Promise<QuizAttemptRecord | null>;
  /**
   * Atomic: returns null if the attempt was already completed (prevents replays).
   * A failed grade stores failedAt + nextEligibleAttemptAt (server clock).
   */
  completeQuizAttempt(id: string, score: number, passed: boolean, nextEligibleAttemptAt: string | null): Promise<QuizAttemptRecord | null>;
  /**
   * One transaction: consume the passed attempt (single use), refuse if the
   * user already has an active whitelist application, then create it. If any
   * step fails nothing is written, so a failed submit never burns the attempt.
   */
  createWhitelistApplication(a: NewApplication & { quiz: NonNullable<NewApplication["quiz"]> }): Promise<{ ok: true; app: ApplicationView } | { ok: false; reason: "ATTEMPT_USED" | "ACTIVE_EXISTS" }>;
  listQuizAttempts(userId?: string): Promise<QuizAttemptView[]>;

  /* notifications + push */
  createNotifications(n: NewNotification[]): Promise<void>;
  listNotifications(discordId: string, take?: number): Promise<NotificationView[]>;
  markNotificationsRead(discordId: string, ids?: string[]): Promise<void>;
  savePushSubscription(s: PushSubscriptionRecord): Promise<void>;
  listPushSubscriptions(discordIds: string[]): Promise<PushSubscriptionRecord[]>;
  deletePushSubscription(endpoint: string): Promise<void>;

  createAuditLog(l: NewAuditLog): Promise<void>;
  listAuditLogs(category?: LogCategory, take?: number): Promise<AuditLogView[]>;
}
