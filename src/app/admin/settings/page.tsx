import { requireAdmin } from "@/lib/guards";
import { AdminTitle } from "@/components/admin/ui";
import { applicationDefinitions } from "@/config/applications";
import { serverConfig } from "@/config/server.config";

export const metadata = { title: "Website Settings" };

const yes = (b: boolean) => (b ? <span className="text-online">Open</span> : <span className="text-silver-500">Closed</span>);
const set = (v: string) => (v ? <span className="font-mono text-online">set</span> : <span className="text-warn">not set</span>);

export default async function AdminSettings() {
  await requireAdmin("/admin/settings", "settings.view");
  const c = serverConfig;
  return (
    <>
      <AdminTitle title="Website settings" sub="Settings come from src/config/server.config.ts and environment variables. Edit them there and redeploy." />
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-3 font-display text-lg font-semibold uppercase tracking-wide text-snow">General</h2>
          <dl className="divide-y divide-white/[0.05] text-sm">
            {[
              ["Name", c.name],
              ["Short name", c.shortName],
              ["Tagline", c.tagline],
              ["Region", c.region],
              ["Site URL", c.siteUrl],
              ["Discord invite", c.discordInvite],
              ["FiveM connect", c.fivemConnectUrl || "— (Enter the City → whitelist)"],
              ["Max players", String(c.maxPlayers)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-2.5">
                <dt className="text-silver-500">{k}</dt>
                <dd className="truncate text-right text-snow">{v}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section className="card p-5">
          <h2 className="mb-3 font-display text-lg font-semibold uppercase tracking-wide text-snow">Applications & store</h2>
          <dl className="divide-y divide-white/[0.05] text-sm">
            {applicationDefinitions.map((d) => (
              <div key={d.type} className="flex justify-between py-2.5">
                <dt className="text-silver-500">{d.short}</dt>
                <dd>{yes(c.applications[d.type].open)}</dd>
              </div>
            ))}
            <div className="flex justify-between py-2.5"><dt className="text-silver-500">Re-apply cooldown</dt><dd className="text-snow">{c.applications.cooldownHours}h</dd></div>
            <div className="flex justify-between py-2.5"><dt className="text-silver-500">Store</dt><dd>{yes(c.store.open)}</dd></div>
            <div className="flex justify-between py-2.5"><dt className="text-silver-500">Store launch date</dt><dd className="text-snow">{c.store.launchDate || "— (no countdown)"}</dd></div>
          </dl>
        </section>
        <section className="card p-5">
          <h2 className="mb-3 font-display text-lg font-semibold uppercase tracking-wide text-snow">Discord roles</h2>
          <dl className="divide-y divide-white/[0.05] text-sm">
            {(["whitelist", "lspd", "ems", "staff", "creator", "supporter"] as const).map((k) => (
              <div key={k} className="flex justify-between py-2.5"><dt className="capitalize text-silver-500">{k}</dt><dd>{set(c.discordRoles[k])}</dd></div>
            ))}
          </dl>
        </section>
        <section className="card p-5">
          <h2 className="mb-3 font-display text-lg font-semibold uppercase tracking-wide text-snow">Log channels</h2>
          <dl className="divide-y divide-white/[0.05] text-sm">
            {Object.entries(c.discordLogChannels).map(([k, v]) => (
              <div key={k} className="flex justify-between py-2.5"><dt className="capitalize text-silver-500">{k}</dt><dd>{set(v)}</dd></div>
            ))}
          </dl>
          <p className="mt-3 text-xs text-silver-500">IDs are shown as set / not set only. Tokens and secrets are never displayed.</p>
        </section>
      </div>
    </>
  );
}
