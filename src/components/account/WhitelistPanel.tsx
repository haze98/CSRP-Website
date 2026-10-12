import { CheckCircle2, Clock, HelpCircle, ShieldCheck, XCircle } from "lucide-react";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { enterCityHref } from "@/config/server.config";
import type { ApplicationView, WhitelistState } from "@/types";
import { ApplicantReply } from "./ApplicantReply";

const date = (iso: string) => new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kathmandu", day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
const dateTime = (iso: string) => new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kathmandu", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso));

const HEAD: Record<WhitelistState, { label: string; tone: string; icon: typeof Clock; text: string }> = {
  NOT_STARTED: { label: "Not started", tone: "text-silver-300", icon: ShieldCheck, text: "Take the 5-question rule assessment to begin your whitelist." },
  QUIZ_IN_PROGRESS: { label: "Assessment in progress", tone: "text-royal-400", icon: Clock, text: "You started the rule assessment but haven't finished it yet." },
  QUIZ_FAILED: { label: "Assessment not passed", tone: "text-crimson-400", icon: XCircle, text: "Review the rules and try again — you'll get a new set of questions." },
  QUIZ_PASSED_INCOMPLETE: { label: "Passed · not submitted", tone: "text-solar", icon: HelpCircle, text: "You passed the assessment. Finish your written answer to submit." },
  PENDING_REVIEW: { label: "Pending review", tone: "text-warn", icon: Clock, text: "Your application is waiting for staff review." },
  APPROVED: { label: "Whitelist approved", tone: "text-online", icon: CheckCircle2, text: "Welcome to Chandra Surya Roleplay." },
  SYNC_ERROR: { label: "Whitelist approved", tone: "text-online", icon: CheckCircle2, text: "Approved — staff are finishing your Discord role setup." },
  REJECTED: { label: "Not approved", tone: "text-crimson-400", icon: XCircle, text: "Your last application wasn't approved. You can apply again." },
};

/** Player-facing whitelist status. Internal staff notes are never rendered here. */
export function WhitelistPanel({ state, application, hasRole }: { state: WhitelistState; application: ApplicationView | null; hasRole: boolean }) {
  const s = hasRole && state !== "PENDING_REVIEW" ? HEAD.APPROVED : HEAD[state];
  const Icon = s.icon;
  const messages = (application?.reviews ?? []).filter((r) => !r.internal && r.note).slice().reverse();
  const approved = state === "APPROVED" || state === "SYNC_ERROR" || hasRole;
  return (
    <section id="whitelist" aria-labelledby="whitelist-t" className="card relative scroll-mt-28 overflow-hidden p-6 sm:p-8">
      <div aria-hidden="true" className={`absolute inset-x-0 top-0 h-px ${approved ? "bg-gradient-to-r from-online/0 via-online/70 to-online/0" : "bg-gradient-to-r from-royal-400/0 via-royal-400/60 to-crimson-500/60"}`} />
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="tag">Whitelist</p>
          <h2 id="whitelist-t" className={`h-display mt-2 flex items-center gap-3 text-4xl ${s.tone}`}>
            <Icon size={28} aria-hidden="true" /> {s.label}
          </h2>
          <p className="mt-2 max-w-xl text-silver-300">{s.text}</p>
          {application && (
            <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-3 text-sm">
              {application.quiz && (
                <div>
                  <dt className="text-xs uppercase tracking-wider text-silver-500">Quiz</dt>
                  <dd className="font-semibold text-snow">Passed • {application.quiz.score}/{application.quiz.total}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs uppercase tracking-wider text-silver-500">Submitted</dt>
                <dd className="font-semibold text-snow">{date(application.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-silver-500">Reference</dt>
                <dd className="font-mono text-snow">{application.publicId}</dd>
              </div>
            </dl>
          )}
        </div>
        <div className="shrink-0">
          {approved ? (
            <ButtonLink href={enterCityHref()} variant="crimson" size="lg">Enter the city</ButtonLink>
          ) : state === "PENDING_REVIEW" ? null : (
            <ButtonLink href="/applications?apply=whitelist" variant="crimson">{state === "QUIZ_PASSED_INCOMPLETE" ? "Continue application" : state === "NOT_STARTED" ? "Start assessment" : "Try again"}</ButtonLink>
          )}
        </div>
      </div>

      {messages.length > 0 && (
        <div className="mt-7 border-t border-white/[0.06] pt-6">
          <p className="tag mb-3">Messages from staff</p>
          <ul className="space-y-3">
            {messages.map((m) => {
              const mine = m.note!.startsWith("Applicant reply:");
              return (
                <li key={m.id} className={`rounded-xl border px-4 py-3 text-sm ${mine ? "ml-8 border-white/[0.06] bg-white/[0.02]" : "border-royal-400/20 bg-royal-500/[0.06]"}`}>
                  <p className="text-xs text-silver-500">{mine ? "You" : "CSRP staff"} · {dateTime(m.createdAt)}</p>
                  <p className="mt-1 whitespace-pre-wrap leading-relaxed text-snow">{mine ? m.note!.replace(/^Applicant reply:\s*/, "") : m.note}</p>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {application?.status === "INFO_REQUESTED" && <ApplicantReply applicationId={application.id} />}
      {state === "NOT_STARTED" && (
        <p className="mt-6 text-xs text-silver-500">
          New here? <Link href="/rules" className="text-royal-400 hover:text-snow">Read the rulebook</Link> before you start.
        </p>
      )}
    </section>
  );
}
