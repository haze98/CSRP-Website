import { ArrowRight } from "lucide-react";
import { CinematicMedia } from "@/components/media/CinematicMedia";
import { Parallax } from "@/components/motion/Parallax";
import Particles from "@/components/effects/Particles";
import { BrandIcon } from "@/components/ui/BrandIcon";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { serverConfig } from "@/config/server.config";
import { AnimatedHeading } from "@/components/motion/AnimatedHeading";
import { resolveMedia } from "@/server/media";

const WEAVE =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'><g fill='none' stroke='white' stroke-width='0.6'><path d='M0 60 L30 30 L60 60 L30 90 Z'/><path d='M60 60 L90 30 L120 60 L90 90 Z'/><path d='M30 30 L60 0 L90 30'/><path d='M30 90 L60 120 L90 90'/><path d='M15 60 L30 45 L45 60 L30 75 Z'/><path d='M75 60 L90 45 L105 60 L90 75 Z'/></g></svg>\")";

/**
 * Closing CTA — full width over the city at night (media slot "cta"), with
 * slow red / blue emergency-light glow at the edges and a calm, darkened
 * centre so the heading stays crisp. Copy and buttons are server-rendered.
 */
export function FinalCta() {
  const media = resolveMedia("cta");
  return (
    <section data-tone="neutral" aria-labelledby="cta-title" className="relative isolate overflow-hidden border-y border-white/[0.06] py-28 sm:py-36 lg:py-44">
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        {/* the city at night (your screenshot, or the light-only fallback) */}
        <Parallax speed={0.08} className="absolute -inset-y-[12%] inset-x-0">
          <CinematicMedia media={media} sizes="100vw" />
        </Parallax>
        {/* emergency-light glow at the edges: red left, blue right (slow, never strobing) */}
        <div className="siren-red absolute -left-[18%] top-[10%] h-[80%] w-[50%] bg-[radial-gradient(closest-side,rgba(220,20,60,0.30),transparent)] mix-blend-screen" />
        <div className="siren-blue absolute -right-[18%] top-[10%] h-[80%] w-[50%] bg-[radial-gradient(closest-side,rgba(47,91,255,0.32),transparent)] mix-blend-screen" />
        {/* street-light haze rising from below */}
        <div className="cta-fog absolute inset-x-[-10%] bottom-[-10%] h-[55%] bg-[radial-gradient(60%_60%_at_50%_100%,rgba(255,150,80,0.10),transparent_70%)] blur-2xl" />
        {/* readability: calm centre + soft section edges */}
        <div className="absolute inset-0 bg-[radial-gradient(48%_60%_at_50%_50%,rgba(5,6,8,0.82),rgba(5,6,8,0.55)_55%,rgba(5,6,8,0.25)_85%)]" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#050608] to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#050608] to-transparent" />
        {/* Nepal geometry, very faint */}
        <div className="absolute inset-0 opacity-[0.03] [mask-image:radial-gradient(ellipse_at_center,#000_20%,transparent_70%)]" style={{ backgroundImage: WEAVE, backgroundSize: "88px 88px" }} />
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
