import { ArrowUpRight, Bug, FileText, Flag, Gavel, LifeBuoy, Lightbulb, ShieldCheck, Video } from "lucide-react";
import Link from "next/link";
import { RevealItem, Stagger } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { serverConfig } from "@/config/server.config";

const cards = [
  { icon: ShieldCheck, title: "Whitelist", text: "Apply for city access and get your role synced in Discord.", href: "/applications?apply=whitelist" },
  { icon: FileText, title: "Applications", text: "LSPD, EMS, staff and creators, each tracked with a reference ID.", href: "/applications" },
  { icon: LifeBuoy, title: "Support", text: "Open a ticket and follow staff replies from your dashboard.", href: "/support" },
  { icon: Flag, title: "Player Reports", text: "Report rule breaks privately, with clips and timestamps.", href: "/support?type=PLAYER_REPORT" },
  { icon: Gavel, title: "Ban Appeals", text: "Ask for a fair second look. Every appeal is read in full.", href: "/support?type=BAN_APPEAL" },
  { icon: Bug, title: "Bug Reports", text: "Send reproducible bugs straight to the developers.", href: "/support?type=BUG_REPORT" },
  { icon: Lightbulb, title: "Suggestions", text: "Pitch ideas and vote on them in the Discord forum.", href: serverConfig.discordInvite },
  { icon: Video, title: "Creator Program", text: "Apply to stream or record your stories in the city.", href: "/applications?apply=creator" },
];

export function Platform() {
  return (
    <section data-tone="neutral" aria-labelledby="platform-title" className="relative py-20 sm:py-28">
      <div className="mx-auto w-full max-w-[1440px] px-5 sm:px-8">
        <SectionHeader
          index="05"
          tag="Players ↔ staff"
          id="platform-title"
          title="Everything"
          accent="in one place."
          lede="Log in once with Discord and handle everything here. Every action syncs with Discord: staff are notified in the right channel instantly, and status changes come back to your dashboard (and your DMs when enabled)."
        />
        <Stagger className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.06] xs:grid-cols-2 lg:grid-cols-4">
          {cards.map(({ icon: Icon, title, text, href }, i) => {
            const external = href.startsWith("http");
            const inner = (
              <>
                <div className="flex items-start justify-between">
                  <span className="grid h-10 w-10 place-items-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-silver-300 transition-colors group-hover:border-crimson-400/40 group-hover:text-crimson-400">
                    <Icon size={18} aria-hidden="true" />
                  </span>
                  <span className="font-display text-xs font-semibold text-silver-500">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <h3 className="mt-8 flex items-center gap-1.5 font-display text-xl font-semibold uppercase tracking-wide text-snow">
                  {title}
                  <ArrowUpRight size={16} aria-hidden="true" className="-translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-silver-400">{text}</p>
              </>
            );
            const cls = "group relative block h-full bg-charcoal p-6 transition-colors hover:bg-panel";
            return (
              <RevealItem key={title}>
                {external ? (
                  <a href={href} target="_blank" rel="noopener noreferrer" className={cls} data-glow="">
                    {inner}
                  </a>
                ) : (
                  <Link href={href} className={cls} data-glow="">
                    {inner}
                  </Link>
                )}
              </RevealItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}
