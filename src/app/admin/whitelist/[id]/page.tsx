import { ArrowLeft, CheckCircle2, EyeOff, MessageSquare } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NoStore, fmtDateTime } from "@/components/admin/ui";
import { WhitelistReview } from "@/components/admin/WhitelistReview";
import { Avatar } from "@/components/ui/Avatar";
import { StatusBadge, statusLabel } from "@/components/ui/StatusBadge";
import { integrations } from "@/lib/env";
import { requireAdmin } from "@/lib/guards";
import { getStore } from "@/lib/store";
import { NotificationService } from "@/services/notification.service";

export const metadata = { title: "Whitelist review" };

export default async function WhitelistReviewPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin("/admin/whitelist", "whitelist.view");
  const { id } = await params;
  const store = await getStore();
  if (!store) return <NoStore />;
  const app = await store.getApplication(id);
  if (!app || app.type !== "whitelist") notFound();
  const [attempts, user] = await Promise.all([store.listQuizAttempts(app.applicant.id), store.getUser(app.applicant.id)]);
  const why = app.answers.find((a) => a.key === "whyJoin")?.answer ?? app.answers[0]?.answer ?? "—";
  const name = app.applicant.displayName || app.applicant.username;
  const previous = attempts.filter((a) => a.completedAt).length;

  return (
    <>
      <Link href="/admin/whitelist" className="mb-5 inline-flex items-center gap-2 text-sm text-silver-400 hover:text-snow">
        <ArrowLeft size={15} /> Whitelist
      </Link>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-sm text-silver-400">{app.publicId}</p>
          <h1 className="h-display mt-1 text-4xl text-snow">Whitelist application</h1>
          <p className="mt-1 text-sm text-silver-500">Submitted {fmtDateTime(app.createdAt)} · updated {fmtDateTime(app.updatedAt)}</p>
        </div>
        <StatusBadge status={app.status} />
      </div>

      {app.roleSyncError && (
        <p role="alert" className="mb-6 rounded-xl border border-crimson-500/30 bg-crimson-500/10 px-4 py-3 text-sm text-crimson-400">
          Discord whitelist role was not granted: {app.roleSyncError}. Fix the bot/role setup, then use “Retry role sync”.
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="card p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-4">
              <Avatar name={name} src={app.applicant.avatarUrl} size={64} />
              <div className="min-w-0">
                <p className="truncate font-display text-2xl font-semibold uppercase tracking-wide text-snow">{name}</p>
                <p className="text-sm text-silver-400">@{app.applicant.username}</p>
                <p className="font-mono text-xs text-silver-500">{app.applicant.discordId}</p>
              </div>
            </div>
            <dl className="mt-6 grid gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-white/[0.08] p-4">
                <dt className="tag !text-[0.6rem]">Quiz</dt>
                <dd className="mt-1 inline-flex items-center gap-1.5 font-display text-xl font-bold text-online"><CheckCircle2 size={16} /> Passed</dd>
              </div>
              <div className="rounded-xl border border-white/[0.08] p-4">
                <dt className="tag !text-[0.6rem]">Score</dt>
                <dd className="mt-1 font-display text-xl font-bold text-snow">{app.quiz ? `${app.quiz.score} / ${app.quiz.total}` : "—"}</dd>
              </div>
              <div className="rounded-xl border border-white/[0.08] p-4">
                <dt className="tag !text-[0.6rem]">Previous attempts</dt>
                <dd className="mt-1 font-display text-xl font-bold text-snow">{previous}</dd>
              </div>
              <div className="rounded-xl border border-white/[0.08] p-4">
                <dt className="tag !text-[0.6rem]">In Discord server</dt>
                <dd className="mt-1 font-display text-xl font-bold text-snow">{integrations.discordBot ? (user?.inGuild ? "Yes" : "No") : "—"}</dd>
              </div>
            </dl>
          </section>

          <section className="card p-5 sm:p-6">
            <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-snow">Why do you want to join CSRP?</h2>
            <p className="mt-3 whitespace-pre-wrap break-words leading-relaxed text-snow/90">{why}</p>
          </section>

          <section className="card p-5 sm:p-6">
            <h2 className="mb-4 font-display text-lg font-semibold uppercase tracking-wide text-snow">History</h2>
            {app.reviews.length ? (
              <ol className="space-y-4 border-l border-white/10 pl-5">
                {app.reviews.map((r) => (
                  <li key={r.id} className="relative text-sm">
                    <span aria-hidden="true" className={`absolute -left-[25px] top-1.5 h-2 w-2 rounded-full ${r.internal ? "bg-silver-500" : "bg-royal-400"}`} />
                    <p className="text-snow">
                      <span className="font-medium">@{r.reviewerName}</span>{" "}
                      {r.toStatus ? <>set status to <b>{statusLabel(r.toStatus)}</b></> : r.internal ? "added an internal note" : "sent a message"}
                      <span className={`ml-2 inline-flex items-center gap-1 rounded-full border px-1.5 text-[0.6rem] uppercase tracking-wider ${r.internal ? "border-white/10 text-silver-500" : "border-royal-400/30 text-royal-400"}`}>
                        {r.internal ? <><EyeOff size={10} /> Internal</> : <><MessageSquare size={10} /> Visible to applicant</>}
                      </span>
                    </p>
                    {r.note && <p className="mt-1.5 whitespace-pre-wrap rounded-lg bg-white/[0.03] px-3 py-2 text-silver-300">{r.note}</p>}
                    <p className="mt-1 text-xs text-silver-500">{fmtDateTime(r.createdAt)}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-silver-500">No actions yet.</p>
            )}
          </section>
        </div>
        <WhitelistReview id={app.id} status={app.status} username={app.applicant.username} hasSyncError={!!app.roleSyncError} channels={{ push: NotificationService.pushConfigured(), dm: integrations.discordBot }} />
      </div>
    </>
  );
}
