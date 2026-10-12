import { requireAdmin } from "@/lib/guards";
import { CheckCircle2, CircleDashed } from "lucide-react";
import { AdminTitle } from "@/components/admin/ui";
import { ModeBadge } from "@/components/ui/States";
import { integrations, mockAllowed } from "@/lib/env";
import { getStore } from "@/lib/store";
import { getStatusSummary } from "@/services/status.service";

export const metadata = { title: "Status" };

export default async function AdminStatus() {
  await requireAdmin("/admin/status");
  const [s, store] = await Promise.all([getStatusSummary(), getStore()]);
  const checks = [
    { k: "Database (DATABASE_URL)", ok: integrations.database, note: store?.kind === "memory" ? "Using in-memory development store" : undefined },
    { k: "Discord OAuth (DISCORD_CLIENT_ID / SECRET)", ok: integrations.discordOAuth },
    { k: "Discord bot (DISCORD_BOT_TOKEN / GUILD_ID)", ok: integrations.discordBot },
    { k: "FiveM (FIVEM_SERVER_IP / PORT)", ok: integrations.fivem },
    { k: "Playtime API (PLAYTIME_API_URL)", ok: integrations.playtime },
  ];
  return (
    <>
      <AdminTitle title="Status & integrations" sub={mockAllowed ? "Demo data is ON (CSRP_MOCK_MODE=true, development only)." : "Missing integrations show honest empty states — no demo values."} />
      <section className="card p-5">
        <h2 className="mb-3 font-display text-lg font-semibold uppercase tracking-wide text-snow">Configuration</h2>
        <ul className="divide-y divide-white/[0.05]">
          {checks.map((c) => (
            <li key={c.k} className="flex items-center justify-between gap-3 py-3 text-sm">
              <span className="text-snow">{c.k}{c.note && <span className="block text-xs text-warn">{c.note}</span>}</span>
              {c.ok ? <span className="flex items-center gap-1.5 text-online"><CheckCircle2 size={15} /> Configured</span> : <span className="flex items-center gap-1.5 text-silver-500"><CircleDashed size={15} /> Missing</span>}
            </li>
          ))}
        </ul>
      </section>
      <section className="card mt-6 p-5">
        <h2 className="mb-3 font-display text-lg font-semibold uppercase tracking-wide text-snow">Live data modes</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {Object.entries(s.mode).map(([k, m]) => (
            <li key={k} className="flex items-center justify-between rounded-lg border border-white/[0.06] px-3 py-2.5 text-sm">
              <span className="capitalize text-snow">{k}</span>
              {m === "live" ? <span className="text-xs font-semibold uppercase tracking-wider text-online">Live</span> : <ModeBadge mode={m} />}
            </li>
          ))}
        </ul>
        <h3 className="mb-2 mt-6 text-sm font-semibold text-snow">Services</h3>
        <ul className="grid gap-2 sm:grid-cols-2">
          {s.services.map((x) => (
            <li key={x.id} className="flex justify-between rounded-lg border border-white/[0.06] px-3 py-2 text-sm">
              <span className="text-silver-300">{x.name}</span>
              <span className={x.state === "operational" ? "text-online" : x.state === "offline" ? "text-crimson-400" : "text-silver-500"}>{x.state}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-silver-500">History graphs need snapshots: call <code className="font-mono">GET /api/cron/snapshot</code> every 5 minutes with <code className="font-mono">Authorization: Bearer CRON_SECRET</code>.</p>
      </section>
    </>
  );
}
