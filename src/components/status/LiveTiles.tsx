"use client";
import { Clock3, Server, ShieldCheck, Users } from "lucide-react";
import type { ReactNode } from "react";
import { Sparkline, type ChartColor } from "@/components/charts/Charts";
import { BrandIcon } from "@/components/ui/BrandIcon";
import { CountUp } from "@/components/ui/CountUp";
import { fivemState, toneDot } from "@/lib/status-labels";
import type { DataMode, StatusHistory, StatusSummary } from "@/types";

/** "Last sync" in Nepal time, formatted identically on server and client. */
export function syncLabel(iso?: string) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kathmandu", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(new Date(iso)) + " NPT";
}

/** Small state chip used when a value isn't live. */
function StateChip({ mode, loading, error }: { mode?: DataMode; loading: boolean; error: boolean }) {
  const s = !mode ? (loading && !error ? { t: "Connecting", c: "border-warn/30 bg-warn/10 text-warn" } : { t: "Not connected", c: "border-white/10 text-silver-500" }) : mode === "unavailable" ? { t: "Not configured", c: "border-white/10 text-silver-400" } : mode === "mock" ? { t: "Demo values", c: "border-white/10 text-silver-400" } : null;
  if (!s)
    return (
      <span className="inline-flex items-center gap-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-online">
        <span className="h-1.5 w-1.5 rounded-full bg-online" />
        Live
      </span>
    );
  return <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-[0.58rem] font-semibold uppercase tracking-[0.14em] ${s.c}`}>{s.t}</span>;
}

/** Flat dashed line when no history exists yet — the graph slot is never empty. */
function SparkPlaceholder() {
  return (
    <svg viewBox="0 0 100 28" preserveAspectRatio="none" className="mt-4 h-7 w-full" aria-hidden="true">
      <path d="M0 20 C 15 18, 25 22, 40 17 S 65 19, 80 14 S 95 16, 100 15" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="1.4" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function Tile({ icon, label, value, spark, color = "royal", foot, chip, className = "" }: { icon: ReactNode; label: string; value: ReactNode; spark?: number[] | null; color?: ChartColor; foot?: ReactNode; chip: ReactNode; className?: string }) {
  return (
    <div data-glow="" className={`card flex flex-col p-5 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2 text-silver-400">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-white/[0.08] bg-white/[0.03] text-silver-300">{icon}</span>
          <span className="tag truncate">{label}</span>
        </span>
        {chip}
      </div>
      <div className="mt-4 font-display text-[2.4rem] font-bold leading-none text-snow">{value}</div>
      {spark === undefined ? null : spark && spark.length > 1 ? <Sparkline data={spark} color={color} className="mt-4" /> : <SparkPlaceholder />}
      {foot && <div className="mt-auto pt-4 text-xs text-silver-500">{foot}</div>}
    </div>
  );
}

const Dash = () => <span className="text-silver-500">--</span>;

/**
 * The five headline live tiles (home preview + /status). Every tile renders
 * immediately: a live value, labelled preview data, or a clear state.
 */
export function LiveTiles({ data, history, loading = false, error = false }: { data: StatusSummary | null; history: StatusHistory | null; loading?: boolean; error?: boolean }) {
  const f = data?.fivem;
  const d = data?.discord;
  const pt = data?.playtime;
  const cap = f?.maxPlayers ?? 128;
  const players = f?.online ? f.players : 0;
  const pct = Math.min(100, (players / cap) * 100);
  const st = fivemState(data, error);
  const uptimeDays = history?.uptime30d.slice(-30) ?? [];
  const chip = (mode?: DataMode) => <StateChip mode={mode} loading={loading || !data} error={error} />;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
      <Tile
        className="lg:col-span-3"
        icon={<Users size={15} />}
        label="Concurrent players"
        chip={chip(data?.mode.fivem)}
        spark={history?.players24h.length ? history.players24h.map((p) => p.v) : null}
        value={
          <>
            {f?.online ? <CountUp value={players} /> : <Dash />} <span className="text-2xl text-silver-500">/ {cap}</span>
          </>
        }
        foot={
          <div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]" role="progressbar" aria-label="Server capacity" aria-valuemin={0} aria-valuemax={cap} aria-valuenow={players}>
              <div className="h-full rounded-full bg-gradient-to-r from-royal-500 to-crimson-500 transition-[width] duration-1000" style={{ width: `${Math.max(pct, 1.5)}%` }} />
            </div>
            <p className="mt-2 flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${toneDot[st.tone]}`} /> Server {st.label.toLowerCase()}
              </span>
              <span>{f?.online ? `${pct.toFixed(0)}% capacity` : "No player data yet"}</span>
            </p>
          </div>
        }
      />
      <Tile
        className="lg:col-span-3"
        icon={<BrandIcon name="discord" size={14} />}
        label="Discord members"
        chip={chip(data?.mode.discord)}
        value={d ? <CountUp value={d.members} /> : <Dash />}
        foot={
          <div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]" aria-hidden="true">
              <div className="h-full rounded-full bg-online/80 transition-[width] duration-1000" style={{ width: `${d && d.members ? Math.min(100, (d.online / d.members) * 100) : 0}%` }} />
            </div>
            <p className="mt-2 flex items-center gap-2">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-online" /> {d ? `${d.online.toLocaleString("en-US")} online now` : "Online count appears when the CSRP bot connects"}
            </p>
          </div>
        }
      />
      <Tile className="lg:col-span-2" icon={<ShieldCheck size={15} />} label="Whitelisted" chip={chip(data?.mode.discord)} value={d?.whitelisted != null ? <CountUp value={d.whitelisted} /> : <Dash />} foot="Members holding the whitelist role" />
      <Tile
        className="lg:col-span-2"
        icon={<Server size={15} />}
        label="Server uptime"
        chip={chip(data?.mode.history)}
        value={data?.uptimePercent != null ? <CountUp value={data.uptimePercent} decimals={2} suffix="%" /> : <Dash />}
        foot={
          <div>
            <div className="flex gap-[3px]" aria-label="Uptime per day, last 30 days" role="img">
              {(uptimeDays.length ? uptimeDays : Array.from({ length: 30 }, () => null)).map((p, i) => (
                <span key={i} className={`h-5 flex-1 rounded-[2px] ${p === null ? "bg-white/[0.06]" : p.v >= 99.5 ? "bg-online/80" : p.v >= 97 ? "bg-warn/80" : "bg-crimson-500/80"}`} title={p ? `${p.v.toFixed(2)}%` : undefined} />
              ))}
            </div>
            <p className="mt-2 flex justify-between">
              <span>30 days ago</span>
              <span>today</span>
            </p>
          </div>
        }
      />
      <Tile
        className="sm:col-span-2 lg:col-span-2"
        icon={<Clock3 size={15} />}
        label="Weekly play time"
        chip={chip(data?.mode.playtime)}
        color="crimson"
        spark={history?.playtime7d.length ? history.playtime7d.map((p) => p.v) : null}
        value={
          pt ? (
            <>
              <CountUp value={pt.weeklyHours} /> <span className="text-2xl text-silver-500">hrs</span>
            </>
          ) : (
            <Dash />
          )
        }
        foot={pt ? `Avg session ${Math.floor(pt.averageSessionMinutes / 60)}h ${pt.averageSessionMinutes % 60}m · peak ${pt.peakPlayers}` : "Tracked by the game server once connected"}
      />
    </div>
  );
}

export function OnlineBadge({ data, error = false }: { data: StatusSummary | null; error?: boolean }) {
  const st = fivemState(data, error);
  const live = st.tone === "online" || st.tone === "mock";
  const cls = live ? "border-online/30 bg-online/10 text-online" : st.tone === "offline" ? "border-crimson-500/30 bg-crimson-500/10 text-crimson-400" : st.tone === "pending" ? "border-warn/30 bg-warn/10 text-warn" : "border-white/10 text-silver-400";
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 font-display text-sm font-semibold uppercase tracking-[0.18em] ${cls}`}>
      <span className="relative flex h-2 w-2">
        {live && <span className="pulse-ring absolute inset-0 rounded-full bg-online" />}
        <span className={`relative h-2 w-2 rounded-full ${toneDot[st.tone]}`} />
      </span>
      {st.label}
    </span>
  );
}
