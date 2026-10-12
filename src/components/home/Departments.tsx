import { ArrowUpRight, HeartPulse, Shield, ShieldCheck, Video } from "lucide-react";
import Link from "next/link";
import { RevealItem, Stagger } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { serverConfig } from "@/config/server.config";

const departments = [
  {
    key: "lspd" as const,
    abbr: "LSPD",
    name: "Los Santos Police Department",
    icon: Shield,
    text: "Patrol, investigate and hold the line. Field training, ranks and a chain of command that rewards good judgement over trigger discipline.",
    tags: ["Patrol", "Detective", "Traffic"],
    tone: "royal",
  },
  {
    key: "ems" as const,
    abbr: "EMS",
    name: "Emergency Medical Services",
    icon: HeartPulse,
    text: "First on scene when it goes wrong. Medical roleplay with real procedures, hospital shifts and a team that has each other's backs.",
    tags: ["Paramedic", "Doctor", "Rescue"],
    tone: "crimson",
  },
  {
    key: "staff" as const,
    abbr: "STAFF",
    name: "Staff Team",
    icon: ShieldCheck,
    text: "Keep the city fair. Handle tickets, review reports and help new players find their feet — with patience and clear judgement.",
    tags: ["Support", "Moderation", "Events"],
    tone: "royal",
  },
  {
    key: "creator" as const,
    abbr: "CREATOR",
    name: "Content Creator Program",
    icon: Video,
    text: "Stream or record your stories in CSRP. Approved creators get a creator role, promotion on our channels and early event access.",
    tags: ["Twitch", "YouTube", "TikTok"],
    tone: "crimson",
  },
];

export function Departments() {
  return (
    <section data-tone="sun" aria-labelledby="dept-title" className="py-20 sm:py-28">
      <div className="container-x">
        <SectionHeader index="04" tag="Departments" id="dept-title" title="Wear the badge." accent="Answer the call." lede="Whitelisted departments recruit all year. Pick your path, read the requirements and apply from your Discord account." />
        <Stagger className="mt-12 grid gap-4 md:grid-cols-2">
          {departments.map((d) => {
            const open = serverConfig.applications[d.key].open;
            const Icon = d.icon;
            return (
              <RevealItem key={d.key}>
                <article data-glow="" className="card group relative flex h-full flex-col overflow-hidden p-6 sm:p-8">
                  <span aria-hidden="true" className={`pointer-events-none absolute -bottom-8 -right-3 font-display text-[8rem] font-bold leading-none tracking-tight ${d.tone === "royal" ? "text-royal-500/[0.06]" : "text-crimson-500/[0.07]"}`}>
                    {d.abbr}
                  </span>
                  <div className="relative flex items-start justify-between gap-4">
                    <span className={`grid h-12 w-12 place-items-center rounded-xl border ${d.tone === "royal" ? "border-royal-400/25 bg-royal-500/10 text-royal-400" : "border-crimson-400/25 bg-crimson-500/10 text-crimson-400"}`}>
                      <Icon size={22} aria-hidden="true" />
                    </span>
                    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.16em] ${open ? "border-online/30 bg-online/10 text-online" : "border-white/10 bg-white/[0.03] text-silver-500"}`}>
                      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${open ? "bg-online" : "bg-silver-500"}`} />
                      Applications {open ? "open" : "closed"}
                    </span>
                  </div>
                  <p className="tag relative mt-6">{d.abbr}</p>
                  <h3 className="h-display relative mt-2 text-3xl text-snow sm:text-4xl">{d.name}</h3>
                  <p className="relative mt-3 max-w-lg leading-relaxed text-silver-400">{d.text}</p>
                  <ul className="relative mt-5 flex flex-wrap gap-2">
                    {d.tags.map((t) => (
                      <li key={t} className="rounded-md border border-white/[0.08] px-2.5 py-1 text-xs text-silver-300">
                        {t}
                      </li>
                    ))}
                  </ul>
                  <div className="relative mt-auto pt-7">
                    {open ? (
                      <Link href={`/applications?apply=${d.key}`} className="inline-flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-[0.16em] text-snow">
                        Apply now
                        <span className="grid h-8 w-8 place-items-center rounded-full border border-white/15 transition-colors group-hover:border-crimson-400 group-hover:bg-crimson-500">
                          <ArrowUpRight size={15} aria-hidden="true" />
                        </span>
                        <span className="absolute inset-0" aria-hidden="true" />
                      </Link>
                    ) : (
                      <a href={serverConfig.discordInvite} target="_blank" rel="noopener noreferrer" className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-silver-500 hover:text-snow">
                        Get notified on Discord →
                      </a>
                    )}
                  </div>
                </article>
              </RevealItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}
