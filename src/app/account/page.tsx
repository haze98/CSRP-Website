import { BadgeCheck, CalendarClock, Clock, FileText, Flag, Fingerprint, HeartPulse, LifeBuoy, Link2, Shield, ShieldAlert, ShieldCheck, Sparkles, Video } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { BrandIcon } from "@/components/ui/BrandIcon";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { StatusBadge, statusLabel } from "@/components/ui/StatusBadge";
import { getDefinition } from "@/config/applications";
import { serverConfig } from "@/config/server.config";
import { supportDefinitions } from "@/config/support";
import { requireAuthenticatedUser } from "@/lib/guards";
import { getStore } from "@/lib/store";
import { UserService } from "@/services/user.service";
import { WhitelistService } from "@/services/whitelist.service";
import { WhitelistPanel } from "@/components/account/WhitelistPanel";
import { ACTIVE_APPLICATION_STATUSES, type ApplicationView, type RoleKey, type TicketView } from "@/types";

export const metadata: Metadata = { title: "My Account", robots: { index: false } };
export const dynamic = "force-dynamic";

const NPT = "Asia/Kathmandu";
const date = (iso: string | null) => (iso ? new Intl.DateTimeFormat("en-GB", { timeZone: NPT, day: "numeric", month: "short", year: "numeric" }).format(new Date(iso)) : "—");
const dateTime = (iso: string) => new Intl.DateTimeFormat("en-GB", { timeZone: NPT, day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso));

const ROLE_META: Record<RoleKey, { label: string; icon: ReactNode }> = {
  whitelist: { label: "Whitelisted", icon: <BadgeCheck size={14} /> },
  lspd: { label: "LSPD", icon: <Shield size={14} /> },
  ems: { label: "EMS", icon: <HeartPulse size={14} /> },
  staff: { label: "Staff", icon: <ShieldCheck size={14} /> },
  creator: { label: "Creator", icon: <Video size={14} /> },
  supporter: { label: "Supporter", icon: <Sparkles size={14} /> },
  admin: { label: "Admin", icon: <ShieldAlert size={14} /> },
};

function Tile({ label, icon, value, sub, tone = "default" }: { label: string; icon: ReactNode; value: ReactNode; sub?: ReactNode; tone?: "good" | "warn" | "default" }) {
  return (
    <div data-glow="" className="card p-5">
      <div className="flex items-center gap-2 text-silver-400">
        <span className="grid h-7 w-7 place-items-center rounded-md border border-white/[0.08] bg-white/[0.03]">{icon}</span>
        <span className="tag">{label}</span>
      </div>
      <p className={`mt-4 font-display text-2xl font-bold uppercase tracking-wide ${tone === "good" ? "text-online" : tone === "warn" ? "text-warn" : "text-snow"}`}>{value}</p>
      {sub && <div className="mt-1 text-xs text-silver-500">{sub}</div>}
    </div>
  );
}

function AppCard({ a }: { a: ApplicationView }) {
  const def = getDefinition(a.type);
  // applicants see status changes only — internal staff notes stay private
  const timeline = a.reviews.filter((r) => r.toStatus);
  return (
    <li className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-xl font-semibold uppercase tracking-wide text-snow">{def?.label ?? a.type}</p>
          <p className="mt-0.5 font-mono text-xs text-silver-400">{a.publicId}</p>
        </div>
        <StatusBadge status={a.status} />
      </div>
      <ol className="mt-4 space-y-2 border-l border-white/10 pl-4 text-xs text-silver-400">
        <li className="relative">
          <span aria-hidden="true" className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-royal-400" />
          Submitted · {dateTime(a.createdAt)}
        </li>
        {timeline.map((r) => (
          <li key={r.id} className="relative">
            <span aria-hidden="true" className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-silver-400" />
            {statusLabel(r.toStatus!)} · {dateTime(r.createdAt)}
          </li>
        ))}
      </ol>
    </li>
  );
}

function TicketRow({ t }: { t: TicketView }) {
  return (
    <li className="flex flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-snow">{t.subject}</p>
        <p className="mt-0.5 text-xs text-silver-500">
          <span className="font-mono">{t.publicId}</span> · {supportDefinitions.find((d) => d.type === t.type)?.label} · {date(t.createdAt)}
        </p>
      </div>
      <StatusBadge status={t.status} />
    </li>
  );
}

function Section({ id, title, icon, action, children }: { id: string; title: string; icon: ReactNode; action?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-t`} className="scroll-mt-28">
      <div className="mb-4 flex items-end justify-between gap-4">
        <h2 id={`${id}-t`} className="flex items-center gap-3 font-display text-2xl font-semibold uppercase tracking-wide text-snow">
          <span className="text-crimson-400">{icon}</span> {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const user = await requireAuthenticatedUser("/account");
  const { denied } = await searchParams;
  const [view, store] = await Promise.all([UserService.getView(user), getStore()]);
  const [apps, tickets] = store ? await Promise.all([store.listUserApplications(user.id), store.listUserTickets(user.id)]) : [[], []];

  const active = apps.filter((a) => ACTIVE_APPLICATION_STATUSES.includes(a.status));
  const wl = apps.filter((a) => a.type === "whitelist")[0];
  const wlState = store ? await WhitelistService.getMyState(user).catch(() => null) : null;
  const isWl = view.roles.includes("whitelist") || wl?.status === "ACCEPTED";
  const depts = view.roles.filter((r) => r === "lspd" || r === "ems" || r === "staff");
  const creator = view.roles.includes("creator") ? "Approved" : apps.find((a) => a.type === "creator") ? statusLabel(apps.find((a) => a.type === "creator")!.status) : "Not applied";
  const reports = tickets.filter((t) => t.type === "PLAYER_REPORT" || t.type === "BAN_APPEAL");
  const support = tickets.filter((t) => !(t.type === "PLAYER_REPORT" || t.type === "BAN_APPEAL"));
  const name = view.displayName || view.username;

  return (
    <div className="container-x pb-16 pt-32 sm:pt-36">
      {denied === "admin" && (
        <p role="alert" className="mb-6 rounded-xl border border-crimson-500/30 bg-crimson-500/10 px-4 py-3 text-sm text-crimson-400">
          The admin panel is restricted to authorized CSRP staff.
        </p>
      )}

      {/* identity */}
      <section className="card relative overflow-hidden p-6 sm:p-8" aria-label="Discord profile">
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(60%_120%_at_0%_0%,rgba(47,91,255,0.18),transparent_60%),radial-gradient(50%_120%_at_100%_100%,rgba(212,22,60,0.14),transparent_60%)]" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-5">
            <Avatar name={name} src={view.avatarUrl} size={84} className="!rounded-2xl ring-2 ring-white/10" />
            <div className="min-w-0">
              <p className="tag">[ Citizen profile ]</p>
              <h1 className="h-display mt-1 truncate text-4xl text-snow sm:text-5xl">{name}</h1>
              <p className="mt-1 text-sm text-silver-400">@{view.username}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {view.roles.length ? (
                  view.roles.map((r) => (
                    <span key={r} className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-void/50 px-2 py-1 text-xs text-silver-300">
                      {ROLE_META[r].icon} {ROLE_META[r].label}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-silver-500">No server roles yet</span>
                )}
              </div>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="flex items-center gap-1.5 text-xs text-silver-500"><Fingerprint size={12} /> Discord ID</dt>
              <dd className="mt-0.5 font-mono text-snow">{view.discordId}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-xs text-silver-500"><CalendarClock size={12} /> Discord since</dt>
              <dd className="mt-0.5 text-snow">{date(view.accountCreatedAt)}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-xs text-silver-500"><Clock size={12} /> Member since</dt>
              <dd className="mt-0.5 text-snow">{date(view.createdAt)}</dd>
            </div>
          </dl>
        </div>
      </section>

      {/* status tiles */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="Whitelist" icon={<BadgeCheck size={14} />} value={isWl ? "Whitelisted" : wl ? statusLabel(wl.status) : "Not applied"} tone={isWl ? "good" : wl ? "warn" : "default"} sub={!isWl && !wl ? <Link href="/applications?apply=whitelist" className="text-royal-400 hover:text-snow">Apply now →</Link> : wl?.publicId} />
        <Tile label="Department" icon={<Shield size={14} />} value={depts.length ? depts.map((d) => ROLE_META[d].label).join(" · ") : "Civilian"} sub={depts.length ? "Synced from Discord roles" : "Join LSPD, EMS or staff"} />
        <Tile label="Creator status" icon={<Video size={14} />} value={creator} tone={creator === "Approved" ? "good" : "default"} />
        <Tile
          label="Connection"
          icon={<Link2 size={14} />}
          value={view.inGuild === true ? "Connected" : view.inGuild === false ? "Not in server" : "Discord linked"}
          tone={view.inGuild === true ? "good" : view.inGuild === false ? "warn" : "default"}
          sub={view.inGuild === false ? <a href={serverConfig.discordInvite} className="text-royal-400 hover:text-snow" target="_blank" rel="noopener noreferrer">Join the Discord →</a> : view.inGuild === null ? "Guild check needs the CSRP bot" : "Verified by the CSRP bot"}
        />
      </div>

      <div className="mt-4">
        <WhitelistPanel state={wlState?.state ?? "NOT_STARTED"} application={wlState?.application ?? null} hasRole={view.roles.includes("whitelist")} />
      </div>

      {!store && (
        <p className="mt-6 rounded-xl border border-warn/25 bg-warn/[0.06] px-4 py-3 text-sm text-warn">The database isn&apos;t connected, so applications and tickets can&apos;t be shown right now.</p>
      )}

      <div className="mt-14 grid gap-14 lg:grid-cols-[1.25fr_1fr]">
        <div className="space-y-14">
          <Section id="applications" title="Current applications" icon={<FileText size={20} />} action={<Link href="/applications" className="text-sm text-royal-400 hover:text-snow">New application →</Link>}>
            {active.length ? (
              <ul className="space-y-3">{active.map((a) => <AppCard key={a.id} a={a} />)}</ul>
            ) : (
              <EmptyState title="Nothing in review" message="Applications you submit appear here with every status change." action={<ButtonLink href="/applications" variant="outline" size="sm">Browse applications</ButtonLink>} />
            )}
          </Section>
          <Section id="history" title="Application history" icon={<Clock size={20} />}>
            {apps.length ? (
              <div className="overflow-hidden rounded-xl border border-white/[0.07]">
                <table className="w-full text-sm max-sm:block">
                  <thead className="bg-white/[0.03] text-left text-xs uppercase tracking-wider text-silver-500 max-sm:hidden">
                    <tr>
                      <th className="px-4 py-2.5 font-semibold">Reference</th>
                      <th className="px-4 py-2.5 font-semibold">Type</th>
                      <th className="px-4 py-2.5 font-semibold">Submitted</th>
                      <th className="px-4 py-2.5 text-right font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05] max-sm:block">
                    {apps.map((a) => (
                      <tr key={a.id} className="max-sm:flex max-sm:flex-wrap max-sm:items-center max-sm:justify-between max-sm:gap-1 max-sm:px-4 max-sm:py-3">
                        <td className="px-4 py-3 font-mono text-xs text-silver-300 max-sm:p-0">{a.publicId}</td>
                        <td className="px-4 py-3 text-snow max-sm:order-3 max-sm:w-full max-sm:p-0 max-sm:text-xs max-sm:text-silver-400">{getDefinition(a.type)?.short}<span className="sm:hidden"> · {date(a.createdAt)}</span></td>
                        <td className="px-4 py-3 text-silver-400 max-sm:hidden">{date(a.createdAt)}</td>
                        <td className="px-4 py-3 text-right max-sm:p-0"><StatusBadge status={a.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState title="No history yet" />
            )}
          </Section>
        </div>
        <div className="space-y-14">
          <Section id="tickets" title="Support tickets" icon={<LifeBuoy size={20} />} action={<Link href="/support" className="text-sm text-royal-400 hover:text-snow">New ticket →</Link>}>
            {support.length ? <ul className="divide-y divide-white/[0.06] overflow-hidden rounded-xl border border-white/[0.07] bg-charcoal/60">{support.map((t) => <TicketRow key={t.id} t={t} />)}</ul> : <EmptyState title="No tickets" message="Questions, bug reports and staff contact show up here." />}
          </Section>
          <Section id="reports" title="Reports & appeals" icon={<Flag size={20} />}>
            {reports.length ? <ul className="divide-y divide-white/[0.06] overflow-hidden rounded-xl border border-white/[0.07] bg-charcoal/60">{reports.map((t) => <TicketRow key={t.id} t={t} />)}</ul> : <EmptyState title="No reports" message="Player reports and ban appeals stay private between you and staff." />}
          </Section>
          <div className="card flex items-center gap-4 p-5">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#5865F2] text-white"><BrandIcon name="discord" size={22} /></span>
            <div className="text-sm">
              <p className="font-semibold text-snow">Signed in with Discord</p>
              <p className="text-silver-500">We only use the identify scope. Roles are checked by the CSRP bot, never by your browser.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
