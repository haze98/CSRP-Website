import { requireAdmin } from "@/lib/guards";
import { Search } from "lucide-react";
import { AdminTitle, NoStore, fmtDateTime } from "@/components/admin/ui";
import { Avatar } from "@/components/ui/Avatar";
import { avatarUrl } from "@/lib/ids";
import { getStore } from "@/lib/store";

export const metadata = { title: "Users" };

export default async function AdminUsers({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireAdmin("/admin/users", "users.view");
  const { q: raw } = await searchParams;
  const q = raw?.slice(0, 80).trim() || undefined;
  const store = await getStore();
  if (!store) return (<><AdminTitle title="Users" /><NoStore /></>);
  const [users, total] = await Promise.all([store.listUsers(q, 100), store.countUsers()]);
  return (
    <>
      <AdminTitle title="Users" sub={`${total} registered · roles are read from Discord, not edited here`} />
      <form className="relative mb-6" action="/admin/users">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-silver-500" aria-hidden="true" />
        <label htmlFor="uq" className="sr-only">Search users</label>
        <input id="uq" name="q" defaultValue={q} placeholder="Search by username or Discord ID…" className="h-11 w-full rounded-lg border border-white/10 bg-void/70 pl-10 pr-4 text-sm text-snow placeholder:text-silver-500 outline-none focus:border-royal-400/70" />
      </form>
      {users.length === 0 ? (
        <p className="card p-10 text-center text-sm text-silver-500">No users found.</p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {users.map((u) => (
            <li key={u.id} className="card flex items-center gap-4 p-4">
              <Avatar name={u.displayName || u.username} src={avatarUrl(u.discordId, u.avatar)} size={44} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-snow">{u.displayName || u.username} <span className="text-silver-500">@{u.username}</span></p>
                <p className="truncate font-mono text-xs text-silver-500">{u.discordId}</p>
                <p className="mt-0.5 text-xs text-silver-500">Last login {u.lastLoginAt ? fmtDateTime(u.lastLoginAt) : "—"}</p>
              </div>
              <div className="flex flex-col items-end gap-1 text-[0.62rem] font-semibold uppercase tracking-wider">
                <span className={u.inGuild ? "text-online" : "text-silver-500"}>{u.inGuild ? "In guild" : "Not in guild"}</span>
                {u.isBanned && <span className="text-crimson-400">Banned</span>}
                <span className="text-silver-500">{u.roleIds.length} roles</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
