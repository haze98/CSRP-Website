"use client";
import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { ApiResult, TicketStatus, TicketView } from "@/types";

const STATUSES: TicketStatus[] = ["OPEN", "ASSIGNED", "WAITING_FOR_PLAYER", "RESOLVED", "CLOSED"];
const fmt = (iso: string) => new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kathmandu", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso));

export function TicketList({ tickets, fieldLabels }: { tickets: TicketView[]; fieldLabels: Record<string, string> }) {
  const router = useRouter();
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const update = async (id: string, status: TicketStatus) => {
    setBusy(id);
    setErr(null);
    try {
      const r = await fetch(`/api/admin/tickets/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, assignToSelf: status === "ASSIGNED" }) });
      const j = (await r.json()) as ApiResult<unknown>;
      if (!j.ok) setErr(j.error);
      else router.refresh();
    } catch {
      setErr("Network error.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      {err && <p role="alert" className="mb-3 text-sm text-crimson-400">{err}</p>}
      <ul className="overflow-hidden rounded-xl border border-white/[0.07] bg-charcoal/60">
        {tickets.map((t) => {
          const expanded = open === t.id;
          return (
            <li key={t.id} className="border-b border-white/[0.05] last:border-0">
              <button type="button" onClick={() => setOpen(expanded ? null : t.id)} aria-expanded={expanded} className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-white/[0.03]">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-snow">{t.subject}</span>
                  <span className="block truncate text-xs text-silver-500">
                    <span className="font-mono">{t.publicId}</span> · @{t.author.username} · {fmt(t.createdAt)}{t.assignedTo ? ` · ${t.assignedTo.username}` : ""}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-3">
                  <StatusBadge status={t.status} />
                  <ChevronDown size={16} className={`text-silver-500 transition-transform ${expanded ? "rotate-180" : ""}`} />
                </span>
              </button>
              {expanded && (
                <div className="space-y-4 border-t border-white/[0.05] bg-void/30 px-4 py-4">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-silver-300">{t.body}</p>
                  {Object.keys(t.details).length > 0 && (
                    <dl className="grid gap-3 sm:grid-cols-2">
                      {Object.entries(t.details).map(([k, v]) => (
                        <div key={k}>
                          <dt className="text-xs text-silver-500">{fieldLabels[k] ?? k}</dt>
                          <dd className="mt-0.5 break-words text-sm text-snow">{/^https?:\/\//.test(v) ? <a href={v} target="_blank" rel="noopener noreferrer nofollow" className="text-royal-400 underline">{v}</a> : v}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-silver-500">Set status:</span>
                    {STATUSES.map((s) => (
                      <button key={s} type="button" disabled={busy === t.id || t.status === s} onClick={() => update(t.id, s)} className="rounded-md border border-white/10 px-2.5 py-1 text-xs text-silver-300 transition-colors hover:border-white/25 hover:text-snow disabled:opacity-40">
                        {s.replace(/_/g, " ").toLowerCase()}
                      </button>
                    ))}
                    <span className="text-xs text-silver-500">Discord ID {t.author.discordId}</span>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
