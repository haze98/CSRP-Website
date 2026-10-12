"use client";
import { CheckCircle2, HelpCircle, LoaderCircle, MessageSquare, NotebookPen, RefreshCw, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { ApiResult, ApplicationStatus } from "@/types";

type Action = "approve" | "reject" | "request_info" | "reply" | "note" | "retry_sync";

/**
 * Review actions. Every request goes to /api/admin/whitelist/:id, which
 * re-verifies the admin allowlist server-side, updates the DB, grants the
 * Discord role (approve), writes audit + Discord logs and notifies the player.
 */
export function WhitelistReview({ id, status, username, hasSyncError, channels }: { id: string; status: ApplicationStatus; username: string; hasSyncError: boolean; channels: { push: boolean; dm: boolean } }) {
  const router = useRouter();
  const [mode, setMode] = useState<"reject" | "request_info" | "reply" | "note">("reply");
  const [text, setText] = useState("");
  const [dm, setDm] = useState(channels.dm);
  const [push, setPush] = useState(channels.push);
  const [busy, setBusy] = useState<Action | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirm, setConfirm] = useState(false);
  const decided = status === "ACCEPTED" || status === "REJECTED" || status === "CLOSED";

  const run = async (action: Action, message?: string) => {
    setBusy(action);
    setMsg(null);
    try {
      const r = await fetch(`/api/admin/whitelist/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, message, dm, push }) });
      const j = (await r.json()) as ApiResult<{ status: ApplicationStatus; roleSyncError: string | null }>;
      if (!j.ok) setMsg({ ok: false, text: j.error });
      else {
        setMsg({ ok: true, text: action === "approve" ? (j.data.roleSyncError ? `Approved — but the Discord role wasn't granted: ${j.data.roleSyncError}` : "Whitelist approved. Player notified.") : "Saved." });
        setText("");
        setConfirm(false);
        router.refresh();
      }
    } catch {
      setMsg({ ok: false, text: "Network error." });
    } finally {
      setBusy(null);
    }
  };

  const MODES = [
    { k: "reply" as const, label: "Reply", icon: MessageSquare, hint: "Visible to the applicant." },
    { k: "request_info" as const, label: "Request info", icon: HelpCircle, hint: "Visible to the applicant; they can reply from their dashboard." },
    { k: "reject" as const, label: "Reject", icon: XCircle, hint: "Reason is shown to the applicant." },
    { k: "note" as const, label: "Internal note", icon: NotebookPen, hint: "Staff only — never shown to the applicant." },
  ];
  const current = MODES.find((m) => m.k === mode)!;

  return (
    <aside className="space-y-4 xl:sticky xl:top-28 xl:self-start">
      <section className="card space-y-4 p-5">
        <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-snow">Decision</h2>
        <Button variant="crimson" className="w-full" disabled={decided || !!busy} onClick={() => setConfirm(true)}>
          <CheckCircle2 size={16} /> Approve whitelist
        </Button>
        {hasSyncError && (
          <Button variant="outline" className="w-full" disabled={!!busy} onClick={() => run("retry_sync")}>
            {busy === "retry_sync" ? <LoaderCircle size={14} className="animate-spin" /> : <RefreshCw size={14} />} Retry role sync
          </Button>
        )}
        <div className="space-y-2 border-t border-white/[0.06] pt-4 text-sm">
          <label className={`flex items-center gap-2.5 ${channels.dm ? "text-silver-300" : "text-silver-500"}`}>
            <input type="checkbox" checked={dm} disabled={!channels.dm} onChange={(e) => setDm(e.target.checked)} className="h-4 w-4 accent-crimson-500" /> Discord DM the applicant {channels.dm ? "" : "(bot not configured)"}
          </label>
          <label className={`flex items-center gap-2.5 ${channels.push ? "text-silver-300" : "text-silver-500"}`}>
            <input type="checkbox" checked={push} disabled={!channels.push} onChange={(e) => setPush(e.target.checked)} className="h-4 w-4 accent-crimson-500" /> Browser push {channels.push ? "" : "(not configured)"}
          </label>
          <p className="text-xs text-silver-500">A website notification is always sent.</p>
        </div>
      </section>

      <section className="card p-5">
        <div className="grid grid-cols-2 gap-1.5" role="tablist" aria-label="Message type">
          {MODES.map(({ k, label, icon: Icon }) => (
            <button key={k} type="button" role="tab" aria-selected={mode === k} disabled={decided && (k === "reject" || k === "request_info")} onClick={() => setMode(k)} className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-medium transition-colors disabled:opacity-40 ${mode === k ? (k === "reject" ? "border-crimson-500/50 bg-crimson-500/10 text-crimson-400" : "border-royal-400/40 bg-royal-500/10 text-snow") : "border-white/10 text-silver-400 hover:text-snow"}`}>
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>
        <label htmlFor="wl-msg" className="sr-only">{current.label}</label>
        <textarea id="wl-msg" value={text} onChange={(e) => setText(e.target.value.slice(0, 1500))} rows={5} placeholder={mode === "reject" ? "e.g. Please review the server rules and provide more detail about the type of RP you want to create." : mode === "request_info" ? "What should the applicant clarify?" : mode === "note" ? "Visible to staff only" : "Message to the applicant"} className="mt-3 w-full resize-y rounded-lg border border-white/10 bg-void/70 px-3 py-2 text-sm text-snow outline-none focus:border-royal-400/70" />
        <p className="mt-1 text-xs text-silver-500">{current.hint}</p>
        <Button variant={mode === "reject" ? "crimson" : "royal"} size="sm" className="mt-3 w-full" disabled={!!busy || text.trim().length < (mode === "reject" || mode === "request_info" ? 5 : 2)} onClick={() => run(mode, text)}>
          {busy === mode && <LoaderCircle size={14} className="animate-spin" />} {mode === "reject" ? "Reject application" : mode === "request_info" ? "Request more information" : mode === "note" ? "Add internal note" : "Send reply"}
        </Button>
      </section>

      {msg && <p role="status" className={`rounded-lg border px-4 py-3 text-sm ${msg.ok ? "border-online/30 bg-online/10 text-online" : "border-crimson-500/30 bg-crimson-500/10 text-crimson-400"}`}>{msg.text}</p>}

      <Modal open={confirm} onRequestClose={() => setConfirm(false)} title="Approve whitelist?" subtitle={`@${username}`}>
        <p className="text-sm leading-relaxed text-silver-300">This will mark the application approved, grant the configured Discord whitelist role through the bot, log the decision, and notify the player.</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setConfirm(false)} data-autofocus="">Cancel</Button>
          <Button variant="crimson" disabled={!!busy} onClick={() => run("approve")}>
            {busy === "approve" ? <LoaderCircle size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Approve @{username}
          </Button>
        </div>
      </Modal>
    </aside>
  );
}
