"use client";
import { AlertTriangle, CheckCircle2, Clock3, Database, Globe, KeyRound, RefreshCw, Server, ShieldCheck, Users, XCircle } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { ChartCard } from "@/components/charts/Charts";
import { BrandIcon } from "@/components/ui/BrandIcon";
import { CountUp } from "@/components/ui/CountUp";
import { ModeBadge } from "@/components/ui/States";
import { useStatus } from "@/hooks/useStatus";
import type { ApiResult, DataMode, ServiceHealth, StatusHistory, StatusSummary } from "@/types";
import { syncLabel } from "./LiveTiles";

const NPT = "Asia/Kathmandu";
const fmt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-GB", { timeZone: NPT, ...o });
const hourLabel = (t: string) => fmt({ hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(t));
const dayLabel = (t: string) => fmt({ weekday: "short" }).format(new Date(t));
const dateLabel = (t: string) => fmt({ day: "numeric", month: "short" }).format(new Date(t));

function duration(sec: number | null | undefined) {
  if (sec === null || sec === undefined) return "—";
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60);
  return h ? `${h}h ${m}m` : `${m}m`;
}

const SERVICE_ICON: Record<ServiceHealth["id"], ReactNode> = {
  fivem: <Server size={16} />,
  database: <Database size={16} />,
  bot: <BrandIcon name="discord" size={15} />,
  website: <Globe size={16} />,
  auth: <KeyRound size={16} />,
  applications: <ShieldCheck size={16} />,
};
const STATE = {
  operational: { label: "Operational", cls: "text-online", dot: "bg-online" },
  degraded: { label: "Degraded", cls: "text-warn", dot: "bg-warn" },
  offline: { label: "Outage", cls: "text-crimson-400", dot: "bg-crimson-500" },
  unknown: { label: "Not configured", cls: "text-silver-500", dot: "bg-silver-500" },
} as const;

function Group({ title, icon, mode, children }: { title: string; icon: ReactNode; mode?: DataMode; children: ReactNode }) {
  return (
    <section className="card p-5 sm:p-6" aria-label={title}>
      <header className="flex items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
        <h2 className="flex items-center gap-2.5 font-display text-lg font-semibold uppercase tracking-[0.12em] text-snow">
          <span className="grid h-8 w-8 place-items-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-silver-300">{icon}</span>
          {title}
        </h2>
        {mode && <ModeBadge mode={mode} />}
      </header>
      <dl className="mt-1 divide-y divide-white/[0.05]">{children}</dl>
    </section>
  );
}

function Row({ k, children }: { k: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3.5">
      <dt className="text-sm text-silver-400">{k}</dt>
      <dd className="text-right font-display text-2xl font-semibold tabular-nums text-snow">{children}</dd>
    </div>
  );
}

export function StatusDashboard({ initial, initialHistory }: { initial: StatusSummary | null; initialHistory: { mode: DataMode; data: StatusHistory } | null }) {
  const { data, refresh, loading } = useStatus(initial);
  const [history, setHistory] = useState(initialHistory);

  useEffect(() => {
    const load = () =>
      fetch("/api/status/history", { cache: "no-store" })
        .then((r) => r.json() as Promise<ApiResult<{ mode: DataMode; data: StatusHistory }>>)
        .then((j) => j.ok && setHistory(j.data))
        .catch(() => {});
    const t = setInterval(load, 5 * 60_000);
    return () => clearInterval(t);
  }, []);

  const services = data?.services ?? [];
  const outage = services.some((s) => s.state === "offline");
  const degraded = services.some((s) => s.state === "degraded");
  const overall = !data ? "checking" : outage ? "outage" : degraded ? "degraded" : "ok";
  const f = data?.fivem;
  const h = history?.data;
  const anyMock = data && Object.values(data.mode).some((m) => m === "mock");

  return (
    <div className="space-y-6">
      {/* overall banner */}
      <div className={`flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6 ${overall === "ok" ? "border-online/25 bg-online/[0.05]" : overall === "checking" ? "border-white/10 bg-white/[0.02]" : overall === "degraded" ? "border-warn/25 bg-warn/[0.05]" : "border-crimson-500/30 bg-crimson-500/[0.06]"}`}>
        <div className="flex items-center gap-4">
          {overall === "ok" ? <CheckCircle2 className="text-online" size={30} /> : overall === "outage" ? <XCircle className="text-crimson-400" size={30} /> : <AlertTriangle className={overall === "degraded" ? "text-warn" : "text-silver-500"} size={30} />}
          <div>
            <p className="tag !text-silver-300">System status</p>
            <p className={`font-display text-2xl font-bold uppercase tracking-wide sm:text-3xl ${overall === "ok" ? "text-online" : overall === "outage" ? "text-crimson-400" : overall === "degraded" ? "text-warn" : "text-silver-400"}`} aria-live="polite">
              {overall === "ok" ? "All systems operational" : overall === "outage" ? "Service disruption" : overall === "degraded" ? "Partially degraded" : "Checking systems…"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-silver-400">
          <span>
            Last sync <time dateTime={data?.syncedAt} className="tabular-nums text-snow">{syncLabel(data?.syncedAt)}</time>
          </span>
          <button type="button" onClick={() => refresh()} className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-2.5 py-1.5 text-silver-300 hover:text-snow" aria-label="Refresh status now">
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {anyMock && (
        <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-silver-300">
          <strong className="font-semibold">Demo values:</strong> CSRP_MOCK_MODE is on in development, so some numbers below are samples. Turn it off to see real data or empty states. Demo values never appear in production.
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Group title="FiveM server" icon={<Server size={16} />} mode={data?.mode.fivem}>
          <Row k="Concurrent players">{f?.online ? <><CountUp value={f.players} /> <span className="text-base text-silver-500">/ {f.maxPlayers}</span></> : "—"}</Row>
          <Row k="Server status">
            <span className={`inline-flex items-center gap-2 text-xl ${!data || data.mode.fivem === "unavailable" ? "text-silver-500" : f?.online ? "text-online" : "text-crimson-400"}`}>
              <span className={`h-2 w-2 rounded-full ${!data || data.mode.fivem === "unavailable" ? "bg-silver-500" : f?.online ? "bg-online" : "bg-crimson-500"}`} />
              {!data || data.mode.fivem === "unavailable" ? "UNKNOWN" : f?.online ? "ONLINE" : "OFFLINE"}
            </span>
          </Row>
          <Row k="Server uptime (30d)">{data?.uptimePercent !== null && data?.uptimePercent !== undefined ? <CountUp value={data.uptimePercent} decimals={2} suffix="%" /> : "—"}</Row>
          <Row k="Current session uptime">{duration(f?.sessionUptimeSeconds)}</Row>
        </Group>
        <Group title="Discord" icon={<BrandIcon name="discord" size={15} />} mode={data?.mode.discord}>
          <Row k="Total members"><CountUp value={data?.discord?.members ?? null} /></Row>
          <Row k="Online / active members"><CountUp value={data?.discord?.online ?? null} /></Row>
          <Row k="Whitelisted role members"><CountUp value={data?.discord?.whitelisted ?? null} /></Row>
        </Group>
        <Group title="Playtime" icon={<Clock3 size={16} />} mode={data?.mode.playtime}>
          <Row k="Weekly play time">{data?.playtime ? <><CountUp value={data.playtime.weeklyHours} /> <span className="text-base text-silver-500">hrs</span></> : "—"}</Row>
          <Row k="Average session">{data?.playtime ? duration(data.playtime.averageSessionMinutes * 60) : "—"}</Row>
          <Row k="Peak players (7d)">{data?.playtime ? <CountUp value={data.playtime.peakPlayers} /> : "—"}</Row>
        </Group>
      </div>

      <section className="card p-5 sm:p-6" aria-labelledby="services-title">
        <h2 id="services-title" className="flex items-center gap-2.5 font-display text-lg font-semibold uppercase tracking-[0.12em] text-snow">
          <span className="grid h-8 w-8 place-items-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-silver-300"><Users size={16} /></span>
          Services
        </h2>
        <ul className="mt-5 grid gap-px overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.06] sm:grid-cols-2 lg:grid-cols-3">
          {(services.length ? services : Array.from({ length: 6 }, (_, i) => ({ id: `s${i}`, name: "", state: "unknown" as const }))).map((s) => {
            const st = STATE[s.state];
            return (
              <li key={s.id} className="flex items-center justify-between gap-3 bg-charcoal px-4 py-4">
                <span className="flex items-center gap-3 text-sm text-snow">
                  <span className="text-silver-400">{SERVICE_ICON[s.id as ServiceHealth["id"]]}</span>
                  {s.name || <span className="skeleton h-3 w-24 rounded" />}
                </span>
                <span className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] ${st.cls}`}>
                  <span className="relative flex h-2 w-2">
                    {s.state === "operational" && <span className="pulse-ring absolute inset-0 rounded-full bg-online" />}
                    <span className={`relative h-2 w-2 rounded-full ${st.dot}`} />
                  </span>
                  {st.label}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="flex items-center justify-between gap-3 pt-6">
        <h2 className="h-display text-3xl text-snow sm:text-4xl">History</h2>
        {history && <ModeBadge mode={history.mode} />}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Server activity · 24h" subtitle="Average players per hour (NPT)" kind="area" data={h?.players24h ?? []} label={hourLabel} />
        <ChartCard title="Players · 7 days" subtitle="Daily peak concurrent players" kind="bar" data={h?.players7d ?? []} label={dayLabel} />
        <ChartCard title="Weekly playtime" subtitle="Total hours played per day" kind="bar" color="crimson" data={h?.playtime7d ?? []} label={dayLabel} format={(v) => `${Math.round(v).toLocaleString("en-US")}h`} />
        <ChartCard title="Uptime history · 30 days" subtitle="Share of checks where the server responded" kind="area" color="crimson" data={h?.uptime30d ?? []} label={dateLabel} maxY={100} minY={Math.min(95, ...(h?.uptime30d ?? []).map((p) => p.v))} format={(v) => `${v.toFixed(1)}%`} />
      </div>
    </div>
  );
}
