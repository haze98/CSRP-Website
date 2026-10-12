/** Domain types shared by services, API routes and UI (independent of Prisma). */
import type { DataMode } from "@/lib/env-types";

export type { DataMode };

/* ------------------------------------------------------------------ status */
export type ServiceState = "operational" | "degraded" | "offline" | "unknown";

export interface FiveMSnapshot {
  online: boolean;
  players: number;
  maxPlayers: number;
  hostname: string | null;
  playerNames?: string[];
  sessionUptimeSeconds: number | null;
}

export interface DiscordStats {
  members: number;
  online: number;
  whitelisted: number | null;
}

export interface PlaytimeStats {
  weeklyHours: number;
  averageSessionMinutes: number;
  peakPlayers: number;
}

export interface SeriesPoint {
  t: string; // ISO timestamp / label
  v: number;
}

export interface StatusHistory {
  players24h: SeriesPoint[];
  players7d: SeriesPoint[];
  playtime7d: SeriesPoint[];
  uptime30d: SeriesPoint[]; // percentage per day
}

export interface ServiceHealth {
  id: "fivem" | "database" | "bot" | "website" | "auth" | "applications";
  name: string;
  state: ServiceState;
}

export interface StatusSummary {
  mode: { fivem: DataMode; discord: DataMode; playtime: DataMode; history: DataMode };
  fivem: FiveMSnapshot | null;
  discord: DiscordStats | null;
  playtime: PlaytimeStats | null;
  uptimePercent: number | null;
  services: ServiceHealth[];
  whitelistOpen: boolean;
  syncedAt: string;
}

/* ------------------------------------------------------------ applications */
export type ApplicationType = "whitelist" | "lspd" | "ems" | "staff" | "creator";
export type ApplicationStatus = "SUBMITTED" | "UNDER_REVIEW" | "INFO_REQUESTED" | "INTERVIEW" | "ACCEPTED" | "REJECTED" | "CLOSED";
export const ACTIVE_APPLICATION_STATUSES: ApplicationStatus[] = ["SUBMITTED", "UNDER_REVIEW", "INFO_REQUESTED", "INTERVIEW"];

export interface ApplicationAnswerView {
  key: string;
  question: string;
  answer: string;
}

export interface ApplicationReviewView {
  id: string;
  reviewerName: string;
  fromStatus: ApplicationStatus | null;
  toStatus: ApplicationStatus | null;
  note: string | null;
  /** false = visible to the applicant (replies, decision reasons). */
  internal: boolean;
  createdAt: string;
}

export interface ApplicationView {
  id: string;
  publicId: string;
  type: ApplicationType;
  status: ApplicationStatus;
  characterName: string | null;
  applicant: { id: string; discordId: string; username: string; displayName: string | null; avatarUrl: string | null };
  assignedTo: { id: string; username: string } | null;
  answers: ApplicationAnswerView[];
  reviews: ApplicationReviewView[];
  /** Whitelist only. Score only — answers/correctness are never exposed. */
  quiz: { score: number; total: number } | null;
  roleSyncError: string | null;
  createdAt: string;
  updatedAt: string;
}

/* ----------------------------------------------------------------- support */
export type TicketType = "SUPPORT" | "PLAYER_REPORT" | "BAN_APPEAL" | "BUG_REPORT" | "CONTACT";
export type TicketStatus = "OPEN" | "ASSIGNED" | "WAITING_FOR_PLAYER" | "RESOLVED" | "CLOSED";

export interface TicketView {
  id: string;
  publicId: string;
  type: TicketType;
  status: TicketStatus;
  subject: string;
  body: string;
  details: Record<string, string>;
  author: { id: string; username: string; discordId: string };
  assignedTo: { id: string; username: string } | null;
  createdAt: string;
  updatedAt: string;
}

/* -------------------------------------------------------------------- user */
export type RoleKey = "whitelist" | "lspd" | "ems" | "staff" | "creator" | "supporter" | "admin";

export interface SessionUser {
  id: string; // internal user id
  discordId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface UserView extends SessionUser {
  roles: RoleKey[];
  /** Website admin access (manual allowlist, verified server-side). null for everyone else. */
  admin: { level: AdminLevel } | null;
  inGuild: boolean | null; // null = unknown (bot not configured)
  accountCreatedAt: string | null;
  createdAt: string;
  lastLoginAt: string | null;
}

/* -------------------------------------------------------------- developers */
export interface DeveloperView {
  discordId: string;
  /** Real Discord profile — null until the bot has fetched it (never invented). */
  displayName: string | null;
  username: string | null;
  avatarUrl: string | null;
  /** True once the Discord profile was fetched successfully. */
  synced: boolean;
  title: string;
  role: string;
  skills: string[];
  status: "online" | "idle" | "dnd" | "offline" | "unknown";
}

/* ------------------------------------------------------------------- logs */
export type LogCategory = "AUTH" | "APPLICATION" | "SUPPORT" | "REPORT" | "STAFF" | "WHITELIST" | "STORE" | "SECURITY";

export interface AuditLogView {
  id: string;
  category: LogCategory;
  action: string;
  actor: { discordId: string; username: string } | null;
  targetId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

/* -------------------------------------------------------------- api shape */
export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string; fieldErrors?: Record<string, string> };

/* ------------------------------------------------------------------ admin */
export const ADMIN_LEVELS = ["OWNER", "HEAD_ADMIN", "ADMIN", "MODERATOR", "APPLICATION_REVIEWER"] as const;
export type AdminLevel = (typeof ADMIN_LEVELS)[number];
/** Granular website-admin permissions (checked server-side on every page, API route and service call). */
export const ADMIN_PERMISSIONS = [
  "whitelist.view",
  "whitelist.approve",
  "whitelist.reject",
  "applications.view",
  "applications.review",
  "users.view",
  "users.manage",
  "support.view",
  "support.reply",
  "reports.view",
  "reports.manage",
  "notifications.send",
  "settings.view",
  "settings.manage",
  "audit.view",
  /** OWNER only — never stored on a database row. */
  "admins.manage",
] as const;
export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

/** Pre-granular permission names that may still sit in AdminAccess rows. */
export const LEGACY_ADMIN_PERMISSIONS: Record<string, AdminPermission[]> = {
  whitelist: ["whitelist.view", "whitelist.approve", "whitelist.reject"],
  applications: ["applications.view", "applications.review"],
  tickets: ["support.view", "support.reply", "reports.view", "reports.manage"],
  users: ["users.view", "users.manage"],
  reminders: ["notifications.send"],
  logs: ["audit.view"],
  settings: ["settings.view", "settings.manage"],
};

export interface AdminAccessView {
  discordId: string;
  level: AdminLevel;
  permissions: AdminPermission[];
  source: "env-owner" | "env" | "db";
  addedBy: string | null;
  active: boolean;
  createdAt: string | null;
}

/* ------------------------------------------------------------- whitelist */
export type WhitelistState =
  | "NOT_STARTED"
  | "QUIZ_IN_PROGRESS"
  | "QUIZ_FAILED"
  | "QUIZ_PASSED_INCOMPLETE"
  | "PENDING_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "SYNC_ERROR";

export interface QuizAttemptView {
  id: string;
  userId: string;
  questionIds: string[];
  score: number | null;
  passed: boolean | null;
  startedAt: string;
  completedAt: string | null;
  failedAt: string | null;
  nextEligibleAttemptAt: string | null;
  usedAt: string | null;
}

/** What the browser receives for a quiz — never includes correctness. */
export interface PublicQuiz {
  attemptId: string;
  questions: { id: string; text: string; options: { id: string; text: string }[] }[];
  passMark: number;
}

/* ---------------------------------------------------------- notifications */
export interface NotificationView {
  id: string;
  kind: string;
  title: string;
  body: string;
  href: string | null;
  readAt: string | null;
  createdAt: string;
}
