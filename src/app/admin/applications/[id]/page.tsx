import { requireAdmin } from "@/lib/guards";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ApplicationActions } from "@/components/admin/ApplicationActions";
import { NoStore, fmtDateTime } from "@/components/admin/ui";
import { Avatar } from "@/components/ui/Avatar";
import { StatusBadge, statusLabel } from "@/components/ui/StatusBadge";
import { getDefinition } from "@/config/applications";
import { getStore } from "@/lib/store";

export const metadata = { title: "Application" };

export default async function AdminApplication({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin("/admin/applications", "applications.view");
  const { id } = await params;
  const store = await getStore();
  if (!store) return <NoStore />;
  const a = await store.getApplication(id);
  if (!a) notFound();
  if (a.type === "whitelist") redirect(`/admin/whitelist/${a.id}`);
  const def = getDefinition(a.type);
  return (
    <>
      <Link href="/admin/applications" className="mb-5 inline-flex items-center gap-2 text-sm text-silver-400 hover:text-snow">
        <ArrowLeft size={15} /> All applications
      </Link>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-sm text-silver-400">{a.publicId}</p>
          <h1 className="h-display mt-1 text-4xl text-snow">{def?.label ?? a.type}</h1>
          <p className="mt-1 text-sm text-silver-500">Submitted {fmtDateTime(a.createdAt)} · updated {fmtDateTime(a.updatedAt)}</p>
        </div>
        <StatusBadge status={a.status} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="mb-4 font-display text-lg font-semibold uppercase tracking-wide text-snow">Answers</h2>
            <dl className="divide-y divide-white/[0.05]">
              {a.answers.map((ans) => (
                <div key={ans.key} className="py-3.5">
                  <dt className="text-xs font-medium text-silver-500">{ans.question}</dt>
                  <dd className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-snow">{ans.answer || <span className="text-silver-500">—</span>}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section className="card p-5">
            <h2 className="mb-4 font-display text-lg font-semibold uppercase tracking-wide text-snow">Review history & internal notes</h2>
            {a.reviews.length ? (
              <ol className="space-y-3 border-l border-white/10 pl-4">
                {a.reviews.map((r) => (
                  <li key={r.id} className="relative text-sm">
                    <span aria-hidden="true" className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-royal-400" />
                    <p className="text-snow">
                      <span className="font-medium">@{r.reviewerName}</span>{" "}
                      {r.toStatus ? <>changed status {r.fromStatus ? <>from <b>{statusLabel(r.fromStatus)}</b> </> : null}to <b>{statusLabel(r.toStatus)}</b></> : "added a note"}
                    </p>
                    {r.note && <p className="mt-1 whitespace-pre-wrap rounded-lg bg-white/[0.03] px-3 py-2 text-silver-300">{r.note}</p>}
                    <p className="mt-0.5 text-xs text-silver-500">{fmtDateTime(r.createdAt)}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-silver-500">No reviews yet.</p>
            )}
          </section>
        </div>
        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="mb-4 font-display text-lg font-semibold uppercase tracking-wide text-snow">Applicant</h2>
            <div className="flex items-center gap-3">
              <Avatar name={a.applicant.displayName || a.applicant.username} src={a.applicant.avatarUrl} size={48} />
              <div className="min-w-0">
                <p className="truncate font-medium text-snow">{a.applicant.displayName || a.applicant.username}</p>
                <p className="truncate text-xs text-silver-500">@{a.applicant.username}</p>
              </div>
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-silver-500">Discord ID</dt><dd className="font-mono text-xs text-snow">{a.applicant.discordId}</dd></div>
              {a.characterName && <div className="flex justify-between gap-3"><dt className="text-silver-500">Character</dt><dd className="text-snow">{a.characterName}</dd></div>}
              <div className="flex justify-between gap-3"><dt className="text-silver-500">Reviewer</dt><dd className="text-snow">{a.assignedTo ? `@${a.assignedTo.username}` : "Unassigned"}</dd></div>
            </dl>
          </section>
          <ApplicationActions id={a.id} status={a.status} assigned={!!a.assignedTo} />
        </div>
      </div>
    </>
  );
}
