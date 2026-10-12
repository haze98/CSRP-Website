import { requireAdmin } from "@/lib/guards";
import { AdminTitle, FilterLink, NoStore, fmtDateTime } from "@/components/admin/ui";
import { serverConfig } from "@/config/server.config";
import { getStore } from "@/lib/store";
import type { LogCategory } from "@/types";

export const metadata = { title: "Discord Logs" };

const CATS: LogCategory[] = ["AUTH", "APPLICATION", "SUPPORT", "REPORT", "STAFF", "WHITELIST", "STORE", "SECURITY"];
const CHANNEL: Record<LogCategory, string> = {
  AUTH: serverConfig.discordLogChannels.auth,
  APPLICATION: serverConfig.discordLogChannels.application,
  SUPPORT: serverConfig.discordLogChannels.support,
  REPORT: serverConfig.discordLogChannels.report,
  STAFF: serverConfig.discordLogChannels.staff,
  WHITELIST: serverConfig.discordLogChannels.whitelist,
  STORE: serverConfig.discordLogChannels.store,
  SECURITY: serverConfig.discordLogChannels.security,
};

export default async function AdminLogs({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  await requireAdmin("/admin/logs", "audit.view");
  const { category } = await searchParams;
  const cat = CATS.includes(category as LogCategory) ? (category as LogCategory) : undefined;
  const store = await getStore();
  if (!store) return (<><AdminTitle title="Discord logs" /><NoStore /></>);
  const logs = await store.listAuditLogs(cat, 150);
  return (
    <>
      <AdminTitle title="Discord logs" sub="Every event is stored here and mirrored to its Discord log channel (when configured)." />
      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
        <FilterLink href="/admin/logs" active={!cat}>All</FilterLink>
        {CATS.map((c) => (
          <FilterLink key={c} href={`/admin/logs?category=${c}`} active={cat === c}>
            {c.toLowerCase()} {CHANNEL[c] ? "" : "·"}
          </FilterLink>
        ))}
      </div>
      <p className="mb-6 text-xs text-silver-500">Categories marked “·” have no Discord channel ID configured — they are stored in the database only.</p>
      {logs.length === 0 ? (
        <p className="card p-10 text-center text-sm text-silver-500">No log entries.</p>
      ) : (
        <ul className="overflow-hidden rounded-xl border border-white/[0.07] bg-charcoal/60 font-mono text-xs">
          {logs.map((l) => (
            <li key={l.id} className="grid gap-1 border-b border-white/[0.05] px-4 py-3 last:border-0 md:grid-cols-[130px_100px_1fr_auto] md:items-center md:gap-4">
              <span className="text-silver-500">{fmtDateTime(l.createdAt)}</span>
              <span className={l.category === "SECURITY" ? "text-crimson-400" : "text-royal-400"}>{l.category}</span>
              <span className="min-w-0 truncate text-snow">
                {l.action}
                {l.targetId && <span className="text-silver-400"> · {l.targetId}</span>}
              </span>
              <span className="text-silver-500">{l.actor ? `@${l.actor.username} (${l.actor.discordId})` : "system"}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
