import { ArrowRight } from "lucide-react";
import { CelestialStage } from "@/components/celestial/CelestialStage";
import Particles from "@/components/effects/Particles";
import { BrandIcon } from "@/components/ui/BrandIcon";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { serverConfig } from "@/config/server.config";
import { AnimatedHeading } from "@/components/motion/AnimatedHeading";

const WEAVE =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'><g fill='none' stroke='white' stroke-width='0.6'><path d='M0 60 L30 30 L60 60 L30 90 Z'/><path d='M60 60 L90 30 L120 60 L90 90 Z'/><path d='M30 30 L60 0 L90 30'/><path d='M30 90 L60 120 L90 90'/><path d='M15 60 L30 45 L45 60 L30 75 Z'/><path d='M75 60 L90 45 L105 60 L90 75 Z'/></g></svg>\")";

/**
 * Closing CTA — full width. Behind the call to action, a real 3D system:
 * the Sun (Surya) turns slowly, the Moon (Chandra) orbits it, and the CSRP
 * crest orbits the Moon. The copy and buttons are server-rendered and never
 * depend on the scene.
 */
export function FinalCta() {
  return (
    <section data-tone="sun" aria-labelledby="cta-title" className="relative isolate overflow-hidden border-y border-white/[0.06] py-28 sm:py-36 lg:py-44">
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        {/* base + fog */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#050608_0%,#080a0f_50%,#050608_100%)]" />
        <div className="cta-fog absolute inset-x-[-10%] bottom-[-10%] h-[55%] bg-[radial-gradient(60%_60%_at_50%_100%,rgba(170,185,220,0.08),transparent_70%)] blur-2xl" />

        {/* Surya → Chandra → CSRP: lazy 3D scene on desktop, static celestial gradient elsewhere */}
        <CelestialStage />

        {/* Nepal geometry + faint stars */}
        <div className="absolute inset-0 opacity-[0.035] [mask-image:radial-gradient(ellipse_at_center,#000_20%,transparent_70%)]" style={{ backgroundImage: WEAVE, backgroundSize: "88px 88px" }} />
        <div className="absolute inset-0 opacity-50 [background-image:radial-gradient(1px_1px_at_12%_20%,rgba(223,232,255,0.7),transparent),radial-gradient(1px_1px_at_32%_78%,rgba(223,232,255,0.5),transparent),radial-gradient(1px_1px_at_58%_14%,rgba(223,232,255,0.6),transparent),radial-gradient(1px_1px_at_76%_66%,rgba(255,200,180,0.5),transparent),radial-gradient(1px_1px_at_90%_30%,rgba(223,232,255,0.5),transparent),radial-gradient(1px_1px_at_46%_52%,rgba(223,232,255,0.4),transparent)]" />
        {/* centre veil keeps text crisp over the art */}
        <div className="absolute inset-0 bg-[radial-gradient(36%_50%_at_50%_50%,rgba(5,6,8,0.78),rgba(5,6,8,0.35)_60%,transparent_80%)]" />
      </div>
      <Particles count={26} />

      <Reveal className="relative mx-auto max-w-3xl px-5 text-center">
        <p className="tag !text-silver-300">[ Your story starts here ]</p>
        <AnimatedHeading id="cta-title" className="h-display mt-5 text-[3.4rem] text-snow sm:text-7xl lg:text-[7rem]" lines={["The city", <span className="bg-[linear-gradient(100deg,#dfe7f2_0%,#f7f9fc_40%,#ef4a5c_80%,#dc143c_100%)] bg-clip-text text-transparent">is waiting.</span>]} />
        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-silver-300 sm:text-lg">Create your character, enter the city, and become part of the Chandra Surya Roleplay community.</p>
        <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <ButtonLink href="/applications?apply=whitelist" variant="crimson" size="lg" className="hover:-translate-y-0.5">
            Apply for Whitelist <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
          </ButtonLink>
          <ButtonLink href={serverConfig.discordInvite} variant="discord" size="lg" className="hover:-translate-y-0.5">
            <BrandIcon name="discord" size={18} /> Join Discord
          </ButtonLink>
        </div>
      </Reveal>
    </section>
  );
}
