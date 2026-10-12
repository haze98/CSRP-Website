import type { Metadata } from "next";
import { ApplicationsBoard } from "@/components/applications/ApplicationsBoard";
import { PageHero } from "@/components/layout/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { serverConfig } from "@/config/server.config";
import type { ApplicationStatus, ApplicationType } from "@/types";

export const metadata: Metadata = {
  title: "Applications",
  description: "Apply for the CSRP whitelist, LSPD, EMS, the staff team or the content creator program.",
};

const flow: { status: ApplicationStatus; text: string }[] = [
  { status: "SUBMITTED", text: "Received and logged. You get a reference like CSRP-LSPD-000127." },
  { status: "UNDER_REVIEW", text: "A reviewer from the department reads your answers." },
  { status: "INTERVIEW", text: "You may be invited to the WFS voice channel in Discord." },
  { status: "ACCEPTED", text: "Roles are granted in Discord and you're onboarded." },
];

export default function ApplicationsPage() {
  const a = serverConfig.applications;
  const openState: Record<ApplicationType, boolean> = { whitelist: a.whitelist.open, lspd: a.lspd.open, ems: a.ems.open, staff: a.staff.open, creator: a.creator.open };
  return (
    <>
      <PageHero
        tag="Applications"
        title="Join the world"
        accent="of CSRP."
        lede="Every role in the city starts with an application. Log in with Discord, answer honestly and take your time — we read every word. You can follow each application's status from your dashboard."
      />
      <section className="container-x pb-8" aria-label="Available applications">
        <ApplicationsBoard openState={openState} />
      </section>

      <section className="container-x py-20" aria-labelledby="flow-title">
        <Reveal>
          <div className="flex items-center gap-3">
            <span className="tag">[ What happens next ]</span>
            <span aria-hidden="true" className="h-px w-16 bg-gradient-to-r from-white/20 to-transparent" />
          </div>
          <h2 id="flow-title" className="h-display mt-4 text-4xl text-snow sm:text-5xl">From submit to city</h2>
        </Reveal>
        <ol className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.06] sm:grid-cols-2 lg:grid-cols-4">
          {flow.map((f, i) => (
            <li key={f.status} className="bg-charcoal p-6">
              <span className="font-display text-sm font-semibold text-silver-500">{String(i + 1).padStart(2, "0")}</span>
              <div className="mt-3">
                <StatusBadge status={f.status} />
              </div>
              <p className="mt-3 text-sm leading-relaxed text-silver-400">{f.text}</p>
            </li>
          ))}
        </ol>
        <p className="mt-6 max-w-3xl text-sm leading-relaxed text-silver-500">
          One active application per department at a time. After a rejection you can re-apply after {a.cooldownHours} hours. Duplicate, plagiarised or AI-written applications are closed without review.
        </p>
      </section>
    </>
  );
}
