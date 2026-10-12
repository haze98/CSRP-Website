import { requireAdmin } from "@/lib/guards";
import { AdminTitle } from "@/components/admin/ui";
import { Avatar } from "@/components/ui/Avatar";
import { ModeBadge } from "@/components/ui/States";
import { serverConfig } from "@/config/server.config";
import { getDevelopers } from "@/services/developer.service";

export const metadata = { title: "Developer Profiles" };

export default async function AdminDevelopers() {
  await requireAdmin("/admin/developers", "settings.manage");
  const devs = await getDevelopers();
  return (
    <>
      <AdminTitle title="Developer profiles" sub="Built only from manually configured Discord IDs — never from a role." action={<ModeBadge mode={devs.mode} />} />
      <div className="card mb-6 p-5 text-sm leading-relaxed text-silver-300">
        <p>
          Configured IDs: <span className="font-mono text-snow">{serverConfig.developers.ids.length ? serverConfig.developers.ids.join(", ") : "none"}</span>
        </p>
        <p className="mt-2 text-silver-400">
          Add IDs in <code className="font-mono text-snow">developers.ids</code> or <code className="font-mono text-snow">DEVELOPER_DISCORD_IDS</code> (comma-separated). Avatar, username and display name are fetched by the bot; set titles, roles and skills in <code className="font-mono text-snow">developers.profiles</code> inside <code className="font-mono text-snow">src/config/server.config.ts</code>.
        </p>
      </div>
      {devs.data.length ? (
        <ul className="grid gap-3 md:grid-cols-2">
          {devs.data.map((d) => (
            <li key={d.discordId} className="card flex items-center gap-4 p-4">
              <Avatar name={d.displayName ?? d.title} src={d.avatarUrl} size={48} />
              <div className="min-w-0">
                <p className="truncate font-medium text-snow">{d.synced ? <>{d.displayName} <span className="text-silver-500">@{d.username}</span></> : <span className="text-warn">Awaiting Discord sync</span>}</p>
                <p className="text-xs text-crimson-400">{d.role ? `${d.title} · ${d.role}` : d.title}</p>
                <p className="truncate font-mono text-xs text-silver-500">{d.discordId}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="card p-8 text-center text-sm text-silver-500">No developer profiles resolved.</p>
      )}
    </>
  );
}
