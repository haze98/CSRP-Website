import { Building2, Code2, Handshake, MessagesSquare, Mountain, Shield, Sparkles, TrendingUp } from "lucide-react";
import { Reveal, RevealItem, Stagger } from "@/components/ui/Reveal";
import { AnimatedHeading } from "@/components/motion/AnimatedHeading";

const pillars = [
  { icon: Sparkles, title: "Immersive roleplay", text: "Characters with motives, fears and consequences — not just loadouts." },
  { icon: Handshake, title: "Community first", text: "Ideas from Discord become features, and players help shape the rules." },
  { icon: TrendingUp, title: "Progression", text: "Careers, reputation and wealth are earned over time, not handed out." },
  { icon: Shield, title: "Departments", text: "Staffed LSPD and EMS with training, ranks and real procedures." },
  { icon: Building2, title: "Businesses", text: "Player-owned shops, garages and venues that need real staff." },
  { icon: MessagesSquare, title: "Realistic interaction", text: "Voice-first roleplay where conversations matter more than combat." },
  { icon: Code2, title: "Active development", text: "Regular updates and custom systems from the CSRP dev team." },
  { icon: Mountain, title: "Nepal-focused community", text: "Built in Nepal, for players who want a home city of their own." },
];

/** Animated Moon → Sun divider (pure CSS). */
export function CelestialDivider({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`relative flex items-center gap-4 ${className}`}>
      <span className="h-3.5 w-3.5 shrink-0 rounded-full bg-[radial-gradient(circle_at_65%_35%,#fff,#c4d8ff_45%,#5f86ff)] shadow-[0_0_18px_rgba(95,134,255,0.7)]" />
      <span className="relative h-px flex-1 overflow-hidden bg-gradient-to-r from-royal-400/60 via-white/15 to-crimson-400/60">
        <span className="divider-spark absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-white to-transparent" />
      </span>
      <span className="h-3.5 w-3.5 shrink-0 rounded-full bg-[radial-gradient(circle_at_40%_40%,#ffd1a6,#f04664_55%,#a8102f)] shadow-[0_0_18px_rgba(240,70,100,0.7)]" />
    </div>
  );
}

export function WhatIsCsrp() {
  return (
    <section data-tone="moon" aria-labelledby="what-title" className="relative py-20 sm:py-28">
      <div className="mx-auto grid w-full max-w-[1440px] gap-12 px-5 sm:px-8 lg:grid-cols-[1fr_1.15fr] lg:gap-20">
        <Reveal className="lg:sticky lg:top-28 lg:self-start">
          <div className="flex items-center gap-3">
            <span className="font-display text-sm font-semibold text-crimson-400">02</span>
            <span className="tag">[ About CSRP ]</span>
          </div>
          <AnimatedHeading id="what-title" className="h-display mt-5 text-[3.4rem] text-snow sm:text-7xl xl:text-[6.4rem]" lines={["Built for", <span className="bg-gradient-to-r from-moon-200 via-snow to-crimson-400 bg-clip-text text-transparent">real roleplay.</span>]} />
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-silver-300">
            CSRP is a Nepal-based FiveM city for people who care about the story more than the score. Every resident has a job, a reputation, friends, enemies and a past that follows them.
          </p>
          <p className="mt-4 max-w-lg leading-relaxed text-silver-400">
            Like the moon and the sun, the city runs on balance — law and crime, calm and chaos, day shifts and night deals. Staff protect that balance with clear rules, and the development team keeps building the systems that make it feel alive.
          </p>
          <CelestialDivider className="mt-10 max-w-md" />
          <p className="mt-4 flex items-center gap-3 text-sm text-silver-400">
            <span className="font-deva text-xl text-snow/85" lang="ne">चन्द्र सूर्य</span>
            Moon and Sun — two forces, one city.
          </p>
        </Reveal>

        <Stagger className="grid gap-px self-start overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.06] sm:grid-cols-2">
          {pillars.map(({ icon: Icon, title, text }, i) => (
            <RevealItem key={title} className="bg-[#0a0c11] p-6 transition-colors hover:bg-panel">
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-royal-400">
                  <Icon size={18} aria-hidden="true" />
                </span>
                <span className="font-display text-xs font-semibold text-silver-500">{String(i + 1).padStart(2, "0")}</span>
              </div>
              <h3 className="mt-5 font-display text-xl font-semibold uppercase tracking-wide text-snow">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-silver-400">{text}</p>
            </RevealItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
