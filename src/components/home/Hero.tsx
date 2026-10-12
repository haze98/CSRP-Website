"use client";
import { m, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { ArrowRight } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { CinematicMedia } from "@/components/media/CinematicMedia";
import { BrandIcon } from "@/components/ui/BrandIcon";
import { ButtonLink } from "@/components/ui/Button";
import { enterCityHref, serverConfig } from "@/config/server.config";
import { useStatus } from "@/hooks/useStatus";
import type { ResolvedMedia } from "@/config/media";
import type { StatusSummary } from "@/types";

const Particles = dynamic(() => import("@/components/effects/Particles"), { ssr: false });

/**
 * Hero — full-bleed cinematic city image (or its light-only fallback) graded
 * dark on the left for the copy, with red / blue key light, drifting
 * particles and very small scroll + pointer parallax (transforms only).
 * Renders instantly; nothing is hidden waiting for JavaScript.
 */
export function Hero({ initial, media }: { initial: StatusSummary | null; media: ResolvedMedia }) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1.0, 1.06]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const textFade = useTransform(scrollYProgress, [0, 0.7], [1, 0.2]);

  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 50, damping: 20 });
  const sy = useSpring(py, { stiffness: 50, damping: 20 });
  const imgX = useTransform(sx, (v) => v * -8);
  const imgY = useTransform(sy, (v) => v * -6);

  useEffect(() => {
    if (reduced || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const on = (e: PointerEvent) => {
      px.set((e.clientX / window.innerWidth) * 2 - 1);
      py.set((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", on, { passive: true });
    return () => window.removeEventListener("pointermove", on);
  }, [reduced, px, py]);

  return (
    <section ref={ref} data-tone="neutral" aria-labelledby="hero-title" className="relative isolate flex min-h-[90svh] items-center overflow-hidden pb-20 pt-28 lg:pb-20 lg:pt-32">
      {/* cinematic background */}
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        {/* full-bleed image (object-fit: cover), tiny scroll / pointer parallax */}
        <m.div style={{ y: bgY, scale: bgScale }} className="absolute inset-0 origin-center">
          <m.div style={{ x: imgX, y: imgY }} className="absolute -inset-3">
            <CinematicMedia media={media} sizes="100vw" priority quality={95} imgClassName="contrast-[1.08] saturate-[0.92]" />
          </m.div>
        </m.div>
        {/* readability grade: ~75% at the left edge → ~45% mid → ~20% right (mobile: top→bottom) */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,6,8,0.45)_0%,rgba(5,6,8,0.62)_50%,rgba(5,6,8,0.85)_100%)] lg:bg-[linear-gradient(90deg,rgba(5,6,8,0.78)_0%,rgba(5,6,8,0.66)_28%,rgba(5,6,8,0.45)_55%,rgba(5,6,8,0.2)_100%)]" />
        {/* soft pool of shade right behind the text block only */}
        <div className="absolute inset-0 hidden lg:block bg-[radial-gradient(38%_55%_at_36%_50%,rgba(5,6,8,0.38),transparent_75%)]" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#050608]/85 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-[26%] bg-gradient-to-t from-[#050608] via-[#050608]/55 to-transparent" />
        {/* CSRP light: cool Chandra tone from the left, Surya red from the right */}
        <div className="glow-drift absolute -left-[15%] top-[5%] h-[85%] w-[50%] bg-[radial-gradient(closest-side,rgba(47,91,255,0.16),transparent)] mix-blend-screen" />
        <div className="glow-drift absolute -right-[10%] top-[5%] h-[90%] w-[55%] bg-[radial-gradient(closest-side,rgba(212,22,60,0.24),transparent)] mix-blend-screen" style={{ animationDelay: "-7s" }} />
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(47,91,255,0.08)_0%,transparent_40%,rgba(220,20,60,0.12)_80%,rgba(220,20,60,0.16))] mix-blend-soft-light" />
        {/* minimal vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_60%,rgba(0,0,0,0.35))]" />
        <div className="hero-dust absolute inset-0" />
      </div>
      <Particles count={34} />

      {/* text block sits centre-left (≈ 36–42% of the page), text itself stays left-aligned */}
      <div className="mx-auto w-full max-w-[1440px] px-5 sm:px-8">
        <m.div style={{ y: textY, opacity: textFade }} className="relative z-10 -mt-[2vh] max-w-[640px] lg:ml-[13%] lg:w-[46%] lg:max-w-[820px] xl:ml-[16%] xl:w-[min(43vw,820px)] 2xl:ml-[12%]">
          <p className="intro-up inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-black/30 px-3.5 py-1.5 text-[0.66rem] font-semibold uppercase tracking-[0.2em] text-silver-300 backdrop-blur-md sm:text-[0.7rem]">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-crimson-500 shadow-[0_0_8px_rgba(220,20,60,0.9)]" />
            Nepal&apos;s FiveM roleplay community
          </p>

          <h1 id="hero-title" className="h-display mt-6 text-[clamp(3.2rem,min(6.6vw,10.5vh),7.6rem)] !leading-[0.86] drop-shadow-[0_6px_30px_rgba(0,0,0,0.6)]">
            <span className="line-mask"><span className="hero-line text-[#f4f5f7]" style={{ ["--li" as string]: 0 }}>Chandra</span></span>
            <span className="line-mask"><span className="hero-line bg-[linear-gradient(100deg,#ef4a5c_0%,#dc143c_50%,#a30f2c_100%)] bg-clip-text text-transparent" style={{ ["--li" as string]: 1 }}>Surya</span></span>
            <span className="line-mask"><span className="hero-line bg-[linear-gradient(100deg,#f7f9fc_0%,#c9d6f2_60%,#7f9cff_100%)] bg-clip-text text-transparent" style={{ ["--li" as string]: 2 }}>Roleplay</span></span>
          </h1>

          <p className="intro-up mt-6 flex items-center gap-3 font-display text-xl font-semibold uppercase tracking-[0.12em] text-snow sm:text-[1.45rem]" style={{ ["--d" as string]: "0.12s" }}>
            <span aria-hidden="true" className="h-px w-9 shrink-0 bg-gradient-to-r from-royal-400 to-crimson-500" />
            {serverConfig.tagline}
          </p>
          <p className="intro-up mt-4 max-w-[34rem] text-base leading-relaxed text-silver-300 sm:text-[1.05rem]" style={{ ["--d" as string]: "0.16s" }}>
            A community-driven, Nepal-focused FiveM roleplay experience — real characters, active departments and stories shaped by the people who live them.
          </p>

          <div className="intro-up mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center" style={{ ["--d" as string]: "0.22s" }}>
            <ButtonLink href="/applications?apply=whitelist" variant="crimson" size="lg">
              Apply for Whitelist <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
            </ButtonLink>
            <ButtonLink href={serverConfig.discordInvite} variant="discord" size="lg">
              <BrandIcon name="discord" size={18} /> Join Discord
            </ButtonLink>
            {serverConfig.fivemConnectUrl && (
              <ButtonLink href={enterCityHref()} variant="light" size="lg">
                Enter the City
              </ButtonLink>
            )}
          </div>

          <div className="intro-up mt-10" style={{ ["--d" as string]: "0.28s" }}>
            <HeroStatusPill initial={initial} />
          </div>
        </m.div>
      </div>

      {/* scroll indicator (desktop) */}
      <a href="#live-strip" className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-silver-500 transition-colors hover:text-snow lg:flex">
        Scroll to explore
        <span aria-hidden="true" className="relative block h-9 w-px overflow-hidden bg-white/10">
          <span className="scroll-line absolute inset-x-0 top-0 h-3 bg-gradient-to-b from-transparent via-snow to-transparent" />
        </span>
      </a>
    </section>
  );
}

/**
 * LIVE · 42 / 128 PLAYERS, CONNECTING…, or SERVER STATUS UNAVAILABLE.
 * Player numbers appear only when the server actually reported them.
 */
function HeroStatusPill({ initial }: { initial: StatusSummary | null }) {
  const { data, error } = useStatus(initial);
  const f = data?.fivem;
  const mode = data?.mode.fivem;
  const live = !!f?.online && (mode === "live" || mode === "mock");
  const state = live ? "live" : !data && !error ? "connecting" : mode === "live" && f && !f.online ? "offline" : "unavailable";
  const dot = state === "live" ? "bg-online" : state === "connecting" ? "bg-warn animate-pulse" : state === "offline" ? "bg-crimson-500" : "bg-silver-500";
  return (
    <Link href="/status" className="glass group inline-flex items-center gap-3 rounded-xl py-2.5 pl-3.5 pr-4 text-sm transition-colors hover:border-white/20">
      <span className="relative flex h-2.5 w-2.5">
        {state === "live" && <span className="pulse-ring absolute inset-0 rounded-full bg-online" />}
        <span className={`relative h-2.5 w-2.5 rounded-full ${dot}`} />
      </span>
      {state === "live" ? (
        <>
          <span className="font-display font-semibold uppercase tracking-[0.16em] text-online">Live</span>
          <span aria-hidden="true" className="h-4 w-px bg-white/15" />
          <span className="font-display font-semibold uppercase tracking-[0.12em] text-snow">
            <span className="tabular-nums">{f!.players}</span> <span className="text-silver-400">/ {f!.maxPlayers}</span> players
          </span>
        </>
      ) : (
        <span className="font-display font-semibold uppercase tracking-[0.14em] text-silver-300">{state === "connecting" ? "Connecting…" : state === "offline" ? "Server offline" : "Server status unavailable"}</span>
      )}
    </Link>
  );
}
