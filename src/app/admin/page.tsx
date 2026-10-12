import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, RefreshCw, UserX } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { NoStore, fmtDateTime } from "@/components/admin/ui";
import { RevealItem, Stagger } from "@/components/ui/Reveal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getDefinition } from "@/config/applications";
import { requireAdmin } from "@/lib/guards";
import { getStore } from "@/lib/store";
import { within } from "@/lib/timeout";
import { getStatusSummary } from "@/services/status.service";
import { ticketPerm } from "@/services/admin.service";
import { WhitelistService } from "@/services/whitelist.service";
import { ACTIVE_APPLICATION_STATUSES, type TicketStatus } from "@/types";

export const metadata = { title: "Overview" };

const OPEN: TicketStatus[] = ["OPEN", "ASSIGNED", "WAITING_FOR_PLAYER"];

function Card({ label, value, href, tone, hint }: { label: string; value: ReactNode; href?: string; tone?: "warn" | "good" | "bad"; hint?: string }) {
  const body = (
    <>
      <p className="tag">{label}</p>
      <p className={`mt-3 font-display text-4xl font-bold ${tone === "warn" ? "text-warn" : tone === "good" ? "text-online" : tone === "bad" ? "text-crimson-400" : "text-snow"}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-silver-500">{hint}</p>}
    </>
  );
  return href ? (
    <Link href={href} data-glow="" className="card block h-full p-5 transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-white/15">
      {body}
    </Link>
  ) : (
    <div className="card h-full p-5">{body}</div>
  );
}

export default async function AdminOverview() {
  const { access } = await requireAdmin("/admin");
  const store = await getStore();
  if (!store) return <NoStore />;
  const can = (p: Parameters<typeof access.permissions.includes>[0]) => access.permissions.includes(p);

  const [rows, apps, tickets, users, status, logs] = await Promise.all([
    can("whitelist.view") ? WhitelistService.listStates() : Promise.resolve([]),
    can("applications.view") || can("whitelist.view") ? store.listApplications({ take: 2000 }) : Promise.resolve([]),
    can("support.view") || can("reports.view") ? store.listTickets({ take: 2000 }).then((ts) => ts.filter((t) => can(ticketPerm(t.type, "view")))) : Promise.resolve([]),
    store.countUsers(),
    within(getStatusSummary(), 1500, null),
    can("audit.view") ? store.listAuditLogs(undefined, 8) : Promise.resolve([]),
  ]);

  const pendingWl = rows.filter((r) => r.state === "PENDING_REVIEW").length;
  const startedNotDone = rows.filter((r) => r.state === "QUIZ_IN_PROGRESS" || r.state === "QUIZ_PASSED_INCOMPLETE").length;
  const notStarted = rows.filter((r) => r.state === "NOT_STARTED").length;
  const syncIssues = rows.filter((r) => r.state === "SYNC_ERROR").length;
  const active = apps.filter((a) => ACTIVE_APPLICATION_STATUSES.includes(a.status));
  const appsWaiting = active.filter((a) => a.type !== "whitelist").length;
  const stale = active.filter((a) => Date.now() - +new Date(a.createdAt) > 24 * 3600_000).length;
  const openOf = (t: string) => tickets.filter((x) => x.type === t && OPEN.includes(x.status)).length;
  const support = tickets.filter((x) => ["SUPPORT", "BUG_REPORT", "CONTACT"].includes(x.type) && OPEN.includes(x.status)).length;
  const f = status?.fivem;
  const serverLabel = !status ? "Connecting" : status.mode.fivem === "unavailable" ? "Not configured" : f?.online ? "Online" : "Offline";

  const attention = [
    { show: pendingWl > 0, icon: <Clock3 size={16} />, text: `${pendingWl} whitelist application${pendingWl === 1 ? "" : "s"} awaiting review`, href: "/admin/whitelist?tab=PENDING_REVIEW", cta: "Review" },
    { show: startedNotDone > 0, icon: <UserX size={16} />, text: `${startedNotDone} user${startedNotDone === 1 ? "" : "s"} started whitelist but haven't completed it`, href: "/admin/whitelist?tab=NOT_COMPLETED", cta: "Remind" },
    { show: stale > 0, icon: <AlertTriangle size={16} />, text: `${stale} application${stale === 1 ? "" : "s"} waiting longer than 24 hours`, href: "/admin/applications?status=SUBMITTED", cta: "Open" },
    { show: syncIssues > 0, icon: <RefreshCw size={16} />, text: `${syncIssues} Discord role synchronization issue${syncIssues === 1 ? "" : "s"}`, href: "/admin/whitelist?tab=SYNC_ERROR", cta: "Fix" },
    { show: notStarted > 0, icon: <UserX size={16} />, text: `${notStarted} registered user${notStarted === 1 ? "" : "s"} never started whitelist`, href: "/admin/whitelist?tab=NOT_STARTED", cta: "View" },
  ].filter((a) => a.show);

  return (
    <>
      <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <RevealItem><Card label="Pending whitelists" value={pendingWl} href="/admin/whitelist?tab=PENDING_REVIEW" tone={pendingWl ? "warn" : undefined} /></RevealItem>
        <RevealItem><Card label="Applications waiting" value={appsWaiting} href="/admin/applications?status=SUBMITTED" tone={appsWaiting ? "warn" : undefined} /></RevealItem>
        <RevealItem><Card label="Open support tickets" value={support} href="/admin/tickets?type=SUPPORT" tone={support ? "warn" : undefined} /></RevealItem>
        <RevealItem><Card label="Player reports" value={openOf("PLAYER_REPORT")} href="/admin/tickets?type=PLAYER_REPORT" tone={openOf("PLAYER_REPORT") ? "bad" : undefined} /></RevealItem>
        <RevealItem><Card label="Ban appeals" value={openOf("BAN_APPEAL")} href="/admin/tickets?type=BAN_APPEAL" /></RevealItem>
        <RevealItem><Card label="Registered users" value={users} href="/admin/users" /></RevealItem>
        <RevealItem><Card label="Current players" value={f?.online ? `${f.players}/${f.maxPlayers}` : "--"} hint={f?.online ? undefined : "No player data"} href="/admin/status" /></RevealItem>
        <RevealItem><Card label="Server status" value={serverLabel} tone={f?.online ? "good" : status?.mode.fivem === "live" ? "bad" : undefined} href="/admin/status" /></RevealItem>
      </Stagger>

      <section className="card mt-8 p-5 sm:p-6" aria-labelledby="attn">
        <h2 id="attn" className="flex items-center gap-2 font-display text-xl font-semibold uppercase tracking-wide text-snow">
          <span className="h-2 w-2 rounded-full bg-crimson-500 shadow-[0_0_10px_rgba(220,20,60,0.8)]" /> Needs attention
        </h2>
        {attention.length ? (
          <ul className="mt-4 divide-y divide-white/[0.06]">
            {attention.map((a) => (
              <li key={a.text} className="flex items-center justify-between gap-4 py-3.5">
                <span className="flex items-center gap-3 text-sm text-snow">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-warn">{a.icon}</span>
                  {a.text}
                </span>
                <Link href={a.href} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 font-display text-xs font-semibold uppercase tracking-[0.14em] text-snow transition-colors hover:border-crimson-400/60 hover:bg-crimson-500">
                  {a.cta} <ArrowRight size={13} />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 flex items-center gap-2 text-sm text-online"><CheckCircle2 size={16} /> Nothing needs attention right now.</p>
        )}
      </section>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold uppercase tracking-wide text-snow">Latest applications</h2>
            <Link href="/admin/applications" className="text-xs text-royal-400 hover:text-snow">All →</Link>
          </div>
          {apps.length ? (
            <ul className="divide-y divide-white/[0.05]">
              {apps.slice(0, 6).map((a) => (
                <li key={a.id}>
                  <Link href={a.type === "whitelist" ? `/admin/whitelist/${a.id}` : `/admin/applications/${a.id}`} className="flex items-center justify-between gap-3 py-3 transition-colors hover:text-snow">
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-snow">{a.applicant.displayName || a.applicant.username} · {getDefinition(a.type)?.short}</span>
                      <span className="block font-mono text-xs text-silver-500">{a.publicId} · {fmtDateTime(a.createdAt)}</span>
                    </span>
                    <StatusBadge status={a.status} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-silver-500">No applications yet.</p>
          )}
        </section>
        <section className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold uppercase tracking-wide text-snow">Recent activity</h2>
            {can("audit.view") && <Link href="/admin/logs" className="text-xs text-royal-400 hover:text-snow">Logs →</Link>}
          </div>
          {logs.length ? (
            <ul className="divide-y divide-white/[0.05]">
              {logs.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span className="min-w-0">
                    <span className="block truncate text-snow">{l.action.replace(/_/g, " ")}</span>
                    <span className="block text-xs text-silver-500">{l.actor ? `@${l.actor.username}` : "system"}{l.targetId ? ` · ${l.targetId}` : ""}</span>
                  </span>
                  <span className="shrink-0 text-xs text-silver-500">{fmtDateTime(l.createdAt)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-silver-500">{can("audit.view") ? "No activity logged yet." : "Activity logs need the audit.view permission."}</p>
          )}
        </section>
      </div>
    </>
  );
}
