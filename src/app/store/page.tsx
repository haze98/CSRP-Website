import { Car, HandHeart, Lock, Shirt, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import { CsrpCrest } from "@/components/brand/CsrpLogo";
import { Countdown } from "@/components/store/Countdown";
import { BrandIcon } from "@/components/ui/BrandIcon";
import { ButtonLink } from "@/components/ui/Button";
import { RevealItem, Stagger } from "@/components/ui/Reveal";
import { serverConfig } from "@/config/server.config";

export const metadata: Metadata = {
  title: "Store",
  description: "The CSRP store is coming soon — cosmetic supporter packages that help keep the city running. Never pay-to-win.",
};

const teasers = [
  { icon: Sparkles, title: "Supporter Packages", text: "A supporter role, a name colour on Discord and our thanks — the simplest way to help with hosting.", tone: "royal" },
  { icon: Car, title: "Vehicle Cosmetics", text: "Liveries, plates and visual tuning. Looks only — performance stays equal for everyone.", tone: "crimson" },
  { icon: Shirt, title: "Character Cosmetics", text: "Clothing, accessories and style packs to make your character unmistakably yours.", tone: "royal" },
  { icon: HandHeart, title: "Community Support", text: "Fund community events, prize pools and new development. Every contribution is reinvested.", tone: "crimson" },
];

export default function StorePage() {
  const launch = serverConfig.store.launchDate;
  return (
    <section className="relative overflow-hidden pb-16 pt-36 sm:pt-44">
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-24 h-[620px] w-[620px] -translate-x-1/2 rounded-full bg-[conic-gradient(from_200deg,rgba(47,91,255,0.22),rgba(212,22,60,0.22),rgba(255,122,61,0.1),rgba(47,91,255,0.22))] opacity-60 blur-[90px]" />
        <div className="rays-turn absolute left-1/2 top-[160px] h-[640px] w-[640px] -ml-[320px] rounded-full opacity-25 [mask-image:radial-gradient(closest-side,transparent_30%,#000_45%,transparent)]" style={{ background: "repeating-conic-gradient(from 0deg, rgba(255,255,255,0.18) 0deg 1deg, transparent 1deg 12deg)" }} />
      </div>
      <div className="container-x">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <div className="intro-up relative">
            <div aria-hidden="true" className="absolute inset-[-18px] rounded-full border border-white/10" />
            <CsrpCrest size={84} animate />
          </div>
          <p className="tag intro-up mt-8" style={{ ["--d" as string]: "0.08s" }}>
            [ CSRP store ]
          </p>
          <h1 className="h-display intro-up mt-4 text-[3.4rem] text-snow sm:text-8xl lg:text-[8.5rem]" style={{ ["--d" as string]: "0.14s" }}>
            Coming
            <br />
            <span className="bg-[linear-gradient(90deg,#c4d8ff,#f4f5f7_40%,#f04664_75%,#ff7a3d)] bg-clip-text text-transparent">soon</span>
          </h1>
          <p className="intro-up mt-6 max-w-lg text-lg text-silver-300" style={{ ["--d" as string]: "0.2s" }}>
            We&apos;re preparing something special for the community.
          </p>
          {launch && (
            <div className="intro-up mt-8" style={{ ["--d" as string]: "0.26s" }}>
              <Countdown target={launch} />
            </div>
          )}
          <div className="intro-up mt-9 flex flex-col items-center gap-3 sm:flex-row" style={{ ["--d" as string]: "0.3s" }}>
            <ButtonLink href={serverConfig.discordInvite} variant="royal" size="lg">
              <BrandIcon name="discord" size={18} /> Join Discord for updates
            </ButtonLink>
          </div>
        </div>

        <Stagger className="mt-20 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {teasers.map(({ icon: Icon, title, text, tone }) => (
            <RevealItem key={title}>
              <article data-glow="" className="card group relative h-full overflow-hidden p-6">
                <div className="flex items-start justify-between">
                  <span className={`grid h-11 w-11 place-items-center rounded-xl border ${tone === "royal" ? "border-royal-400/25 bg-royal-500/10 text-royal-400" : "border-crimson-400/25 bg-crimson-500/10 text-crimson-400"}`}>
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-silver-500">
                    <Lock size={10} aria-hidden="true" /> Soon
                  </span>
                </div>
                <h2 className="mt-8 font-display text-2xl font-semibold uppercase tracking-wide text-snow">{title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-silver-400">{text}</p>
                <div aria-hidden="true" className="mt-6 space-y-2">
                  <div className="skeleton h-2 w-3/4 rounded-full" />
                  <div className="skeleton h-2 w-1/2 rounded-full" />
                </div>
              </article>
            </RevealItem>
          ))}
        </Stagger>

        <div className="mx-auto mt-12 flex max-w-3xl flex-col items-center gap-3 rounded-2xl border border-online/20 bg-online/[0.04] px-6 py-5 text-center sm:flex-row sm:text-left">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-online/15 font-display text-sm font-bold text-online">0%</span>
          <p className="text-sm leading-relaxed text-silver-300">
            <span className="font-semibold text-snow">Never pay-to-win.</span> Nothing in the CSRP store will give an advantage in roleplay, combat, the economy or whitelisting. Supporters get cosmetics and our gratitude — that&apos;s it.
          </p>
        </div>
      </div>
    </section>
  );
}
