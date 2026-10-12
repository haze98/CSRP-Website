"use client";
import { LoaderCircle, Lock, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { AdminAccessView, AdminLevel, AdminPermission, ApiResult } from "@/types";

const ASSIGNABLE: AdminLevel[] = ["HEAD_ADMIN", "ADMIN", "MODERATOR", "APPLICATION_REVIEWER"];

export function AdminAccessManager({ admins, levels, defaults }: { admins: AdminAccessView[]; levels: Record<AdminLevel, string>; defaults: Record<AdminLevel, AdminPermission[]> }) {
  const router = useRouter();
  const [id, setId] = useState("");
  const [level, setLevel] = useState<AdminLevel>("APPLICATION_REVIEWER");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const save = async (discordId: string, lvl: AdminLevel, active: boolean) => {
    setBusy(discordId);
    setMsg(null);
    const r = await fetch("/api/admin/admins", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ discordId: discordId.trim(), level: lvl, active }) });
    const j = (await r.json()) as ApiResult<unknown>;
    setBusy(null);
    if (!j.ok) return setMsg({ ok: false, text: j.error });
    setMsg({ ok: true, text: active ? "Access saved." : "Access revoked." });
    setId("");
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <section className="card p-5">
        <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-snow">Grant access</h2>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <label className="flex-1">
            <span className="sr-only">Discord user ID</span>
            <input value={id} onChange={(e) => setId(e.target.value.replace(/[^\d]/g, ""))} inputMode="numeric" placeholder="Discord user ID (e.g. 123456789012345678)" className="h-11 w-full rounded-lg border border-white/10 bg-void/70 px-4 font-mono text-sm text-snow placeholder:font-sans placeholder:text-silver-500 outline-none focus:border-royal-400/70" />
          </label>
          <label>
            <span className="sr-only">Access level</span>
            <select value={level} onChange={(e) => setLevel(e.target.value as AdminLevel)} className="h-11 rounded-lg border border-white/10 bg-void/70 px-3 text-sm text-snow outline-none focus:border-royal-400/70">
              {ASSIGNABLE.map((l) => (
                <option key={l} value={l} className="bg-charcoal">{levels[l]}</option>
              ))}
            </select>
          </label>
          <Button variant="crimson" disabled={id.length < 15 || !!busy} onClick={() => save(id, level, true)}>
            {busy === id ? <LoaderCircle size={14} className="animate-spin" /> : <UserPlus size={14} />} Grant
          </Button>
        </div>
        <p className="mt-2 text-xs text-silver-500">Permissions: {defaults[level].join(", ")}. OWNER can only be set with ADMIN_OWNER_DISCORD_ID.</p>
        {msg && <p role="status" className={`mt-3 text-sm ${msg.ok ? "text-online" : "text-crimson-400"}`}>{msg.text}</p>}
      </section>

      <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-charcoal/60">
        <ul className="divide-y divide-white/[0.05]">
          {admins.map((a) => (
            <li key={a.discordId} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
              <div className="min-w-0">
                <p className="font-mono text-sm text-snow">{a.discordId}</p>
                <p className="text-xs text-silver-500">
                  {levels[a.level]} · {a.permissions.join(", ")} · {a.source === "db" ? `added by ${a.addedBy}` : "environment"}
                  {!a.active && <span className="ml-2 text-crimson-400">revoked</span>}
                </p>
              </div>
              {a.source === "db" ? (
                <div className="flex items-center gap-2">
                  <select defaultValue={a.level} onChange={(e) => save(a.discordId, e.target.value as AdminLevel, a.active)} aria-label={`Level for ${a.discordId}`} className="h-9 rounded-md border border-white/10 bg-void/70 px-2 text-xs text-snow">
                    {ASSIGNABLE.map((l) => (
                      <option key={l} value={l} className="bg-charcoal">{levels[l]}</option>
                    ))}
                  </select>
                  <Button variant={a.active ? "outline" : "royal"} size="sm" disabled={busy === a.discordId} onClick={() => save(a.discordId, a.level, !a.active)}>
                    {a.active ? "Revoke" : "Restore"}
                  </Button>
                </div>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs text-silver-500"><Lock size={12} /> Set in environment</span>
              )}
            </li>
          ))}
          {admins.length === 0 && <li className="px-4 py-8 text-center text-sm text-silver-500">No admins configured.</li>}
        </ul>
      </section>
    </div>
  );
}
