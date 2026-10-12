"use client";
import { AnimatePresence, m } from "motion/react";
import { BellRing, ChevronRight, LoaderCircle, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { ApiResult, WhitelistState } from "@/types";

export interface WhitelistRow {
  userId: string;
  discordId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  state: WhitelistState;
  appId: string | null;
  publicId: string | null;
  quiz: { score: number; total: number } | null;
  attempts: number;
  submittedAt: string | null;
  lastActivity: string;
}

const STATE: Record<WhitelistState, { label: string; cls: string }> = {
  NOT_STARTED: { label: "Not started", cls: "border-white/10 text-silver-400" },
  QUIZ_IN_PROGRESS: { label: "Quiz in progress", cls: "border-royal-400/30 bg-royal-500/10 text-royal-400" },
  QUIZ_FAILED: { label: "Quiz failed", cls: "border-crimson-500/30 bg-crimson-500/10 text-crimson-400" },
  QUIZ_PASSED_INCOMPLETE: { label: "Passed · not submitted", cls: "border-solar/30 bg-solar/10 text-solar" },
  PENDING_REVIEW: { label: "Pending review", cls: "border-warn/30 bg-warn/10 text-warn" },
  APPROVED: { label: "Approved", cls: "border-online/30 bg-online/10 text-online" },
  REJECTED: { label: "Rejected", cls: "border-crimson-500/30 bg-crimson-500/10 text-crimson-400" },
  SYNC_ERROR: { label: "Role sync error", cls: "border-crimson-500/40 bg-crimson-500/15 text-crimson-400" },
};

const TABS: { key: string; label: string; states?: WhitelistState[] }[] = [
  { key: "PENDING_REVIEW", label: "Pending review", states: ["PENDING_REVIEW"] },
  { key: "APPROVED", label: "Approved", states: ["APPROVED"] },
  { key: "REJECTED", label: "Rejected", states: ["REJECTED"] },
  { key: "NOT_COMPLETED", label: "Not completed", states: ["QUIZ_IN_PROGRESS", "QUIZ_PASSED_INCOMPLETE"] },
  { key: "QUIZ_FAILED", label: "Quiz failed", states: ["QUIZ_FAILED"] },
  { key: "NOT_STARTED", label: "Not started", states: ["NOT_STARTED"] },
  { key: "SYNC_ERROR", label: "Missing role", states: ["SYNC_ERROR"] },
  { key: "ALL", label: "All" },
];
const REMINDABLE: WhitelistState[] = ["NOT_STARTED", "QUIZ_IN_PROGRESS", "QUIZ_FAILED", "QUIZ_PASSED_INCOMPLETE"];
const fmt = (iso: string) => new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kathmandu", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso));

export function WhitelistTable({ rows, initialTab, initialQuery, canRemind, channels }: { rows: WhitelistRow[]; initialTab: string; initialQuery: string; canRemind: boolean; channels: { push: boolean; dm: boolean } }) {
  const [tab, setTab] = useState(TABS.some((t) => t.key === initialTab) ? initialTab : "PENDING_REVIEW");
  const [q, setQ] = useState(initialQuery);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [remind, setRemind] = useState<{ all: boolean } | null>(null);

  const counts = useMemo(() => Object.fromEntries(TABS.map((t) => [t.key, t.states ? rows.filter((r) => t.states!.includes(r.state)).length : rows.length])), [rows]);
  const visible = useMemo(() => {
    const t = TABS.find((x) => x.key === tab);
    const ql = q.trim().toLowerCase();
    return rows
      .filter((r) => !t?.states || t.states.includes(r.state))
      .filter((r) => !ql || r.username.toLowerCase().includes(ql) || (r.displayName ?? "").toLowerCase().includes(ql) || r.discordId.includes(ql) || (r.publicId ?? "").toLowerCase().includes(ql))
      .sort((a, b) => +new Date(b.lastActivity) - +new Date(a.lastActivity));
  }, [rows, tab, q]);
  const selectable = visible.filter((r) => REMINDABLE.includes(r.state));
  const allSelected = selectable.length > 0 && selectable.every((r) => sel.has(r.userId));

  const switchTab = (k: string) => {
    setTab(k);
    setSel(new Set());
    const url = new URL(window.location.href);
    url.searchParams.set("tab", k);
    window.history.replaceState(null, "", url);
  };

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="h-display text-4xl text-snow">Whitelist</h1>
          <p className="mt-1 text-sm text-silver-400">Every registered player and where they are in the whitelist journey.</p>
        </div>
        {canRemind && (
          <Button variant="outline" size="sm" onClick={() => setRemind({ all: true })}>
            <BellRing size={14} /> Remind everyone not finished
          </Button>
        )}
      </div>

      <div className="no-scrollbar -mx-1 mb-4 flex gap-1 overflow-x-auto px-1" role="tablist" aria-label="Whitelist status">
        {TABS.map((t) => (
          <button key={t.key} role="tab" type="button" aria-selected={tab === t.key} onClick={() => switchTab(t.key)} className={`relative shrink-0 rounded-lg px-3 py-2 text-sm transition-colors ${tab === t.key ? "text-snow" : "text-silver-400 hover:text-snow"}`}>
            {tab === t.key && <m.span layoutId="wl-tab" className="absolute inset-0 rounded-lg bg-white/[0.07] ring-1 ring-white/10" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
            <span className="relative">{t.label}</span>
            <span className={`relative ml-2 rounded-full px-1.5 text-[0.68rem] tabular-nums ${tab === t.key ? "bg-crimson-500 text-white" : "bg-white/[0.06] text-silver-400"}`}>{counts[t.key]}</span>
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="relative min-w-[240px] flex-1">
          <span className="sr-only">Search</span>
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-silver-500" aria-hidden="true" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Discord name, Discord ID or application ID…" className="h-11 w-full rounded-lg border border-white/10 bg-void/70 pl-10 pr-4 text-sm text-snow placeholder:text-silver-500 outline-none focus:border-royal-400/70" />
        </label>
        <AnimatePresence>
          {canRemind && sel.size > 0 && (
            <m.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
              <Button variant="crimson" size="sm" onClick={() => setRemind({ all: false })}>
                <BellRing size={14} /> Send reminder ({sel.size})
              </Button>
            </m.div>
          )}
        </AnimatePresence>
      </div>

      {visible.length === 0 ? (
        <p className="card p-10 text-center text-sm text-silver-500">No players in this view.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-charcoal/60">
          <div className="hidden grid-cols-[28px_1.6fr_1fr_0.7fr_0.6fr_0.9fr_24px] items-center gap-4 border-b border-white/[0.06] px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-silver-500 md:grid">
            {canRemind && selectable.length > 0 ? (
              <input type="checkbox" aria-label="Select all remindable players" checked={allSelected} onChange={() => setSel(allSelected ? new Set() : new Set(selectable.map((r) => r.userId)))} className="h-4 w-4 accent-crimson-500" />
            ) : (
              <span />
            )}
            <span>Player</span>
            <span>Status</span>
            <span>Quiz</span>
            <span>Attempts</span>
            <span>Last activity</span>
            <span />
          </div>
          <ul>
            <AnimatePresence initial={false}>
              {visible.map((r) => {
                const st = STATE[r.state];
                const href = r.appId ? `/admin/whitelist/${r.appId}` : null;
                return (
                  <m.li key={r.userId} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="grid grid-cols-[28px_1fr_auto] items-center gap-x-4 gap-y-2 border-b border-white/[0.05] px-4 py-3 last:border-0 md:grid-cols-[28px_1.6fr_1fr_0.7fr_0.6fr_0.9fr_24px]">
                    {canRemind && REMINDABLE.includes(r.state) ? (
                      <input type="checkbox" aria-label={`Select ${r.username}`} checked={sel.has(r.userId)} onChange={() => setSel((s) => { const n = new Set(s); if (n.has(r.userId)) n.delete(r.userId); else n.add(r.userId); return n; })} className="h-4 w-4 accent-crimson-500" />
                    ) : (
                      <span />
                    )}
                    <span className="flex min-w-0 items-center gap-3">
                      <Avatar name={r.displayName || r.username} src={r.avatarUrl} size={36} className="!rounded-lg" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-snow">{r.displayName || r.username}</span>
                        <span className="block truncate font-mono text-[0.7rem] text-silver-500">@{r.username} · {r.discordId}{r.publicId ? ` · ${r.publicId}` : ""}</span>
                      </span>
                    </span>
                    <span className="col-start-3 row-start-1 md:col-auto md:row-auto">
                      <span className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[0.66rem] font-semibold uppercase tracking-[0.1em] ${st.cls}`}>{st.label}</span>
                    </span>
                    <span className="col-start-2 text-xs text-silver-300 md:col-auto">{r.quiz ? <>Passed · <span className="tabular-nums text-snow">{r.quiz.score}/{r.quiz.total}</span></> : "—"}</span>
                    <span className="hidden text-xs tabular-nums text-silver-300 md:block">{r.attempts}</span>
                    <span className="hidden text-xs text-silver-500 md:block">{fmt(r.lastActivity)}</span>
                    {href ? (
                      <Link href={href} aria-label={`Review ${r.username}`} className="col-start-3 grid h-7 w-7 place-items-center rounded-md text-silver-400 hover:bg-white/[0.06] hover:text-snow md:col-auto">
                        <ChevronRight size={16} />
                      </Link>
                    ) : (
                      <span />
                    )}
                  </m.li>
                );
              })}
            </AnimatePresence>
          </ul>
        </div>
      )}

      <RemindDialog
        open={!!remind}
        onClose={() => setRemind(null)}
        all={remind?.all ?? false}
        userIds={[...sel]}
        channels={channels}
        onSent={() => {
          setSel(new Set());
          setRemind(null);
        }}
      />
    </>
  );
}

function RemindDialog({ open, onClose, all, userIds, channels, onSent }: { open: boolean; onClose: () => void; all: boolean; userIds: string[]; channels: { push: boolean; dm: boolean }; onSent: () => void }) {
  const [web, setWeb] = useState(true);
  const [push, setPush] = useState(channels.push);
  const [dm, setDm] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const body = (dryRun: boolean) => JSON.stringify({ ...(all ? { allIncomplete: true } : { userIds }), web, push, dm, dryRun });
  const preview = async () => {
    setBusy(true);
    setMsg(null);
    const r = await fetch("/api/admin/whitelist/remind", { method: "POST", headers: { "Content-Type": "application/json" }, body: body(true) });
    const j = (await r.json()) as ApiResult<{ recipients: number }>;
    setBusy(false);
    if (j.ok) setCount(j.data.recipients);
    else setMsg({ ok: false, text: j.error });
  };
  const send = async () => {
    setBusy(true);
    const r = await fetch("/api/admin/whitelist/remind", { method: "POST", headers: { "Content-Type": "application/json" }, body: body(false) });
    const j = (await r.json()) as ApiResult<{ recipients: number }>;
    setBusy(false);
    if (j.ok) {
      setMsg({ ok: true, text: `Reminder sent to ${j.data.recipients} player${j.data.recipients === 1 ? "" : "s"}.` });
      setTimeout(onSent, 1200);
    } else setMsg({ ok: false, text: j.error });
  };

  return (
    <Modal open={open} onRequestClose={() => { setCount(null); setMsg(null); onClose(); }} title="Send whitelist reminder" subtitle={all ? "Everyone who hasn't completed whitelist" : `${userIds.length} selected player${userIds.length === 1 ? "" : "s"}`}>
      <p className="rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm text-silver-300">“Complete your CSRP whitelist application to continue your journey into the city.”</p>
      <fieldset className="mt-5 space-y-2.5">
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-silver-500">Deliver via</legend>
        <label className="flex items-center gap-3 text-sm text-snow"><input type="checkbox" checked={web} onChange={(e) => { setWeb(e.target.checked); setCount(null); }} className="h-4 w-4 accent-crimson-500" /> Website notification</label>
        <label className={`flex items-center gap-3 text-sm ${channels.push ? "text-snow" : "text-silver-500"}`}><input type="checkbox" disabled={!channels.push} checked={push} onChange={(e) => { setPush(e.target.checked); setCount(null); }} className="h-4 w-4 accent-crimson-500" /> Browser push {channels.push ? "(opted-in devices)" : "— VAPID keys not configured"}</label>
        <label className={`flex items-center gap-3 text-sm ${channels.dm ? "text-snow" : "text-silver-500"}`}><input type="checkbox" disabled={!channels.dm} checked={dm} onChange={(e) => { setDm(e.target.checked); setCount(null); }} className="h-4 w-4 accent-crimson-500" /> Discord DM {channels.dm ? "" : "— bot not configured"}</label>
      </fieldset>
      {msg && <p role="status" className={`mt-4 text-sm ${msg.ok ? "text-online" : "text-crimson-400"}`}>{msg.text}</p>}
      <div className="mt-6 flex items-center justify-between gap-3 border-t border-white/[0.06] pt-4">
        <p className="text-sm text-silver-400">{count === null ? "Check recipients before sending." : <><span className="font-semibold text-snow">{count}</span> recipient{count === 1 ? "" : "s"} will be notified.</>}</p>
        {count === null ? (
          <Button variant="outline" size="sm" disabled={busy || (!web && !push && !dm)} onClick={preview}>{busy && <LoaderCircle size={14} className="animate-spin" />} Count recipients</Button>
        ) : (
          <Button variant="crimson" size="sm" disabled={busy || count === 0} onClick={send}>{busy && <LoaderCircle size={14} className="animate-spin" />} Confirm & send to {count}</Button>
        )}
      </div>
    </Modal>
  );
}
