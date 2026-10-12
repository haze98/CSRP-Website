"use client";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { ApiResult, ApplicationStatus } from "@/types";

const ACTIONS: { status: ApplicationStatus; label: string; variant: "royal" | "crimson" | "outline" }[] = [
  { status: "UNDER_REVIEW", label: "Mark under review", variant: "outline" },
  { status: "INTERVIEW", label: "Request interview", variant: "royal" },
  { status: "ACCEPTED", label: "Accept", variant: "royal" },
  { status: "REJECTED", label: "Reject", variant: "crimson" },
  { status: "CLOSED", label: "Close", variant: "outline" },
];

/**
 * Staff actions. Every call goes to a staff-only API route that re-checks
 * the Discord role server-side, updates the DB, logs to Discord and
 * optionally DMs the applicant.
 */
export function ApplicationActions({ id, status, assigned }: { id: string; status: ApplicationStatus; assigned: boolean }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [notify, setNotify] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const call = async (key: string, body: Record<string, unknown>) => {
    setBusy(key);
    setMsg(null);
    try {
      const r = await fetch(`/api/admin/applications/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = (await r.json()) as ApiResult<unknown>;
      if (!j.ok) setMsg({ ok: false, text: j.error });
      else {
        setMsg({ ok: true, text: "Saved." });
        setNote("");
        router.refresh();
      }
    } catch {
      setMsg({ ok: false, text: "Network error." });
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="card space-y-5 p-5" aria-label="Review actions">
      <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-snow">Review</h2>
      <div>
        <label htmlFor="note" className="mb-2 block text-xs font-medium text-silver-400">Internal note (staff only)</label>
        <textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} rows={3} className="w-full resize-y rounded-lg border border-white/10 bg-void/70 px-3 py-2 text-sm text-snow outline-none focus:border-royal-400/70" placeholder="Optional — attached to the next action" />
        <Button variant="outline" size="sm" className="mt-2" disabled={!note.trim() || !!busy} onClick={() => call("note", { action: "note", note })}>
          {busy === "note" && <LoaderCircle size={14} className="animate-spin" />} Add note only
        </Button>
      </div>
      <label className="flex items-center gap-2 text-sm text-silver-300">
        <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="h-4 w-4 accent-crimson-500" />
        DM the applicant on Discord
      </label>
      <div className="grid gap-2">
        {ACTIONS.map((a) => (
          <Button key={a.status} variant={a.variant} size="sm" disabled={status === a.status || !!busy} onClick={() => call(a.status, { action: "status", status: a.status, note: note.trim() || undefined, notify })}>
            {busy === a.status && <LoaderCircle size={14} className="animate-spin" />} {a.label}
          </Button>
        ))}
      </div>
      <div className="flex gap-2 border-t border-white/[0.06] pt-4">
        <Button variant="ghost" size="sm" disabled={!!busy} onClick={() => call("assign", { action: "assign", reviewerId: "me" })}>Assign to me</Button>
        {assigned && <Button variant="ghost" size="sm" disabled={!!busy} onClick={() => call("unassign", { action: "assign", reviewerId: null })}>Unassign</Button>}
      </div>
      {msg && <p role="status" className={`text-sm ${msg.ok ? "text-online" : "text-crimson-400"}`}>{msg.text}</p>}
    </section>
  );
}
