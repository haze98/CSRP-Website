import { Bell, CalendarDays, HeartPulse, LifeBuoy, Megaphone, MessagesSquare, Shield, ShieldCheck, Users, Video } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { DiscordJoin } from "@/components/discord/DiscordJoin";
import { PageHero } from "@/components/layout/PageHero";
import { RevealItem, Stagger } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { within } from "@/lib/timeout";
import { getStatusSummary } from "@/services/status.service";

export const metadata: Metadata = {
  title: "Discord",
  description: "Join the Chandra Surya Roleplay Discord — announcements, whitelist, departments, events and support.",
};

export const revalidate = 30;

const benefits = [
  { icon: Megaphone, title: "First to know", text: "Server updates, patch notes and whitelist waves are announced here first." },
  { icon: CalendarDays, title: "Events", text: "City festivals, races and community nights — with sign-ups and reminders." },
  { icon: MessagesSquare, title: "Find your people", text: "Meet players looking for crews, businesses and storylines." },
  { icon: Bell, title: "Status alerts", text: "Restarts and maintenance pings so you never wonder if the city is down." },
];

const departments = [
  { icon: Shield, name: "LSPD", text: "Private channels for briefings, training schedules and rosters." },
  { icon: HeartPulse, name: "EMS", text: "Shift coordination, protocols and medical training sessions." },
  { icon: ShieldCheck, name: "Staff", text: "Ticket handling, report review and staff coordination." },
  { icon: Video, name: "Creators", text: "Stream schedules, clip sharing and creator announcements." },
];

const discordRules = [
  "Be respectful — no harassment, hate speech or discrimination.",
  "Keep in-character information out of Discord (no meta gaming).",
  "No advertising other servers or communities.",
  "Use the right channel; support goes through tickets, not DMs to staff.",
  "No NSFW, gore or shock content anywhere.",
  "Staff decisions can be appealed through the website, not argued in public channels.",
];

export default async function DiscordPage() {
  const status = await within(getStatusSummary(), 1200, null);
  return (
    <>
      <PageHero tag="CSRP community" title="Where the city" accent="talks." lede="The CSRP Discord is the heart of the community — and the account you use there is the one you log in with here." />
      <div className="container-x space-y-24 pb-16">
        <DiscordJoin initial={status} />

        <section aria-labelledby="benefits-title">
          <SectionHeader index="01" tag="Why join" id="benefits-title" title="Community benefits" />
          <Stagger className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map(({ icon: Icon, title, text }) => (
              <RevealItem key={title}>
                <article data-glow="" className="card h-full p-6">
                  <Icon size={20} className="text-royal-400" aria-hidden="true" />
                  <h3 className="mt-5 font-display text-xl font-semibold uppercase tracking-wide text-snow">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-silver-400">{text}</p>
                </article>
              </RevealItem>
            ))}
          </Stagger>
        </section>

        <section aria-labelledby="dept-comm-title" className="grid gap-10 lg:grid-cols-2">
          <div>
            <SectionHeader index="02" tag="Departments" id="dept-comm-title" title="Department" accent="communication." lede="Accepted members get department roles automatically synced from their application, unlocking private channels." />
            <ul className="mt-8 divide-y divide-white/[0.06] border-y border-white/[0.06]">
              {departments.map(({ icon: Icon, name, text }) => (
                <li key={name} className="flex items-start gap-4 py-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-silver-300">
                    <Icon size={18} aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-display text-lg font-semibold uppercase tracking-wide text-snow">{name}</p>
                    <p className="text-sm text-silver-400">{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-4">
            <div className="card p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <LifeBuoy size={20} className="text-crimson-400" aria-hidden="true" />
                <h2 className="font-display text-2xl font-semibold uppercase tracking-wide text-snow">Support information</h2>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-silver-400">Need help? Open a ticket in the website Support Center — staff are notified in Discord instantly and you can track replies from your dashboard. For urgent in-city issues during a scene, use the in-game /report command.</p>
              <div className="mt-5 flex flex-wrap gap-2 text-sm">
                <Link href="/support" className="rounded-lg border border-white/10 px-3 py-2 text-snow hover:border-white/25">Support Center</Link>
                <Link href="/support?type=PLAYER_REPORT" className="rounded-lg border border-white/10 px-3 py-2 text-snow hover:border-white/25">Player report</Link>
                <Link href="/support?type=BAN_APPEAL" className="rounded-lg border border-white/10 px-3 py-2 text-snow hover:border-white/25">Ban appeal</Link>
              </div>
            </div>
            <div className="card p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <Users size={20} className="text-royal-400" aria-hidden="true" />
                <h2 className="font-display text-2xl font-semibold uppercase tracking-wide text-snow">Discord rules summary</h2>
              </div>
              <ol className="mt-4 space-y-2.5">
                {discordRules.map((r, i) => (
                  <li key={r} className="flex gap-3 text-sm text-silver-300">
                    <span className="font-display font-semibold text-crimson-400">{String(i + 1).padStart(2, "0")}</span>
                    {r}
                  </li>
                ))}
              </ol>
              <Link href="/rules" className="mt-5 inline-block text-sm text-royal-400 hover:text-snow">
                Read the full city rulebook →
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
