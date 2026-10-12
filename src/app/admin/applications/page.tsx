import { requireAdmin } from "@/lib/guards";
import { Search } from "lucide-react";
import Link from "next/link";
import { AdminTitle, FilterLink, NoStore, fmtDateTime } from "@/components/admin/ui";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { applicationDefinitions, getDefinition } from "@/config/applications";
import { getStore } from "@/lib/store";
import type { ApplicationStatus, ApplicationType } from "@/types";

export const metadata = { title: "Applications" };

const STATUSES: ApplicationStatus[] = ["SUBMITTED", "UNDER_REVIEW", "INTERVIEW", "ACCEPTED", "REJECTED", "CLOSED"];
const TYPES = applicationDefinitions.map((d) => d.type);

export default async function AdminApplications({ searchParams }: { searchParams: Promise<{ type?: string; status?: string; q?: string }> }) {
  await requireAdmin("/admin/applications", "applications.view");
  const sp = await searchParams;
  const type = TYPES.includes(sp.type as ApplicationType) ? (sp.type as ApplicationType) : undefined;
  const status = STATUSES.includes(sp.status as ApplicationStatus) ? (sp.status as ApplicationStatus) : undefined;
  const q = sp.q?.slice(0, 80).trim() || undefined;
  const store = await getStore();
  if (!store) return (<><AdminTitle title="Applications" /><NoStore /></>);
  const apps = await store.listApplications({ type, status, q, take: 100 });
  const link = (p: Record<string, string | undefined>) => {
    const u = new URLSearchParams();
    const m = { type, status, q, ...p };
    Object.entries(m).forEach(([k, v]) => v && u.set(k, v));
    const s = u.toString();
    return `/admin/applications${s ? `?${s}` : ""}`;
  };
  return (
    <>
      <AdminTitle title="Applications" sub={`${apps.length} shown`} />
      <form className="relative mb-4" action="/admin/applications">
        {type && <input type="hidden" name="type" value={type} />}
        {status && <input type="hidden" name="status" value={status} />}
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-silver-500" aria-hidden="true" />
        <label className="sr-only" htmlFor="q">Search applications</label>
        <input id="q" name="q" defaultValue={q} placeholder="Search by ID, username, character…" className="h-11 w-full rounded-lg border border-white/10 bg-void/70 pl-10 pr-4 text-sm text-snow placeholder:text-silver-500 outline-none focus:border-royal-400/70" />
      </form>
      <div className="no-scrollbar mb-2 flex gap-2 overflow-x-auto">
        <FilterLink href={link({ type: undefined })} active={!type}>All types</FilterLink>
        {applicationDefinitions.map((d) => (
          <FilterLink key={d.type} href={link({ type: d.type })} active={type === d.type}>{d.short}</FilterLink>
        ))}
      </div>
      <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto">
        <FilterLink href={link({ status: undefined })} active={!status}>Any status</FilterLink>
        {STATUSES.map((s) => (
          <FilterLink key={s} href={link({ status: s })} active={status === s}>{s.replace("_", " ").toLowerCase()}</FilterLink>
        ))}
      </div>
      {apps.length === 0 ? (
        <p className="card p-10 text-center text-sm text-silver-500">No applications match these filters.</p>
      ) : (
        <ul className="overflow-hidden rounded-xl border border-white/[0.07] bg-charcoal/60">
          <li className="hidden grid-cols-[1.3fr_1fr_0.8fr_0.9fr_auto] gap-4 border-b border-white/[0.06] px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-silver-500 md:grid">
            <span>Applicant</span><span>Reference</span><span>Type</span><span>Submitted</span><span className="text-right">Status</span>
          </li>
          {apps.map((a) => (
            <li key={a.id} className="border-b border-white/[0.05] last:border-0">
              <Link href={a.type === "whitelist" ? `/admin/whitelist/${a.id}` : `/admin/applications/${a.id}`} className="grid gap-1 px-4 py-3.5 transition-colors hover:bg-white/[0.03] md:grid-cols-[1.3fr_1fr_0.8fr_0.9fr_auto] md:items-center md:gap-4">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-snow">{a.applicant.displayName || a.applicant.username}</span>
                  <span className="block truncate text-xs text-silver-500">@{a.applicant.username}{a.characterName ? ` · ${a.characterName}` : ""}</span>
                </span>
                <span className="font-mono text-xs text-silver-300">{a.publicId}</span>
                <span className="text-sm text-silver-300">{getDefinition(a.type)?.short}</span>
                <span className="text-xs text-silver-500">{fmtDateTime(a.createdAt)}{a.assignedTo ? ` · ${a.assignedTo.username}` : ""}</span>
                <span className="md:text-right"><StatusBadge status={a.status} /></span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
