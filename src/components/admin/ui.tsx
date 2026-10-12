import Link from "next/link";
import type { ReactNode } from "react";

export const NPT = "Asia/Kathmandu";
export const fmtDateTime = (iso: string) => new Intl.DateTimeFormat("en-GB", { timeZone: NPT, day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso));

export function AdminTitle({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="h-display text-4xl text-snow">{title}</h1>
        {sub && <p className="mt-1 text-sm text-silver-400">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function NoStore() {
  return <p className="rounded-xl border border-warn/25 bg-warn/[0.06] px-4 py-3 text-sm text-warn">The database is not connected. Set DATABASE_URL and run <code className="font-mono">npm run db:push</code>.</p>;
}

export function FilterLink({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <Link href={href} aria-current={active ? "true" : undefined} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${active ? "border-crimson-400/60 bg-crimson-500/15 text-snow" : "border-white/10 text-silver-400 hover:text-snow"}`}>
      {children}
    </Link>
  );
}

export function Stat({ label, value, href, tone }: { label: string; value: ReactNode; href?: string; tone?: "warn" | "good" }) {
  const inner = (
    <>
      <p className="tag">{label}</p>
      <p className={`mt-3 font-display text-4xl font-bold ${tone === "warn" ? "text-warn" : tone === "good" ? "text-online" : "text-snow"}`}>{value}</p>
    </>
  );
  return href ? (
    <Link href={href} data-glow="" className="card block p-5 transition-colors hover:border-white/15">
      {inner}
    </Link>
  ) : (
    <div className="card p-5">{inner}</div>
  );
}
