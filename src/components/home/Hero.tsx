"use client";
import { m, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { ArrowRight } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { CsrpCrest } from "@/components/brand/CsrpLogo";
import { BrandIcon } from "@/components/ui/BrandIcon";
import { ButtonLink } from "@/components/ui/Button";
import { enterCityHref, serverConfig } from "@/config/server.config";
import { useStatus } from "@/hooks/useStatus";
import type { StatusSummary } from "@/types";

const Particles = dynamic(() => import("@/components/effects/Particles"), { ssr: false });

/**
 * Hero — renders instantly (no data needed). Left: badge, title, copy,
 * actions and a live pill. Right: Moon (Chandra) + Sun (Surya) with the CSRP
 * crest set into the orbit. Pointer + scroll parallax use transforms only.
 */
export function Hero({ initial }: { initial: StatusSummary | null }) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const sceneY = useTransform(scrollYProgress, [0, 1], [0, 110]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, 50]);

  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 60, damping: 20 });
  const sy = useSpring(py, { stiffness: 60, damping: 20 });
  const moonX = useTransform(sx, (v) => v * -16);
  const moonY = useTransform(sy, (v) => v * -10);
  const sunX = useTransform(sx, (v) => v * 14);
  const sunY = useTransform(sy, (v) => v * 10);
  const crestX = useTransform(sx, (v) => v * 6);
  const crestY = useTransform(sy, (v) => v * 5);

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
    <section ref={ref} data-tone="neutral" aria-labelledby="hero-title" className="relative isolate flex min-h-[88svh] items-center overflow-hidden pb-20 pt-28 lg:min-h-[94svh] lg:pb-24">
      {/* local atmosphere — fades out at the bottom so the page flows on (no hard edge) */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 [mask-image:linear-gradient(to_bottom,#000_62%,transparent)]">
        <div className="absolute inset-0 bg-[radial-gradient(50%_65%_at_6%_42%,rgba(47,91,255,0.15),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(42%_55%_at_70%_62%,rgba(120,150,255,0.08),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(45%_55%_at_86%_28%,rgba(212,22,60,0.17),transparent_70%)]" />
        {/* faint orbital line across the hero */}
        <svg viewBox="0 0 1600 900" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
          <ellipse cx="1050" cy="470" rx="900" ry="330" fill="none" stroke="rgba(176,182,195,0.07)" strokeWidth="1" transform="rotate(-8 1050 470)" />
          <ellipse cx="1050" cy="470" rx="640" ry="230" fill="none" stroke="rgba(176,182,195,0.05)" strokeWidth="1" strokeDasharray="3 9" transform="rotate(-8 1050 470)" />
        </svg>
        {/* drifting dust */}
        <div className="hero-dust absolute inset-0" />
      </div>
      <Particles count={38} />

      <div className="mx-auto grid w-full max-w-[1440px] items-center gap-12 px-5 sm:px-8 lg:grid-cols-[1.02fr_1fr] lg:gap-6">
        {/* LEFT — copy */}
        <m.div style={{ y: textY }} className="relative z-10 max-w-[640px]">
          <p className="intro-up inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-[0.66rem] font-semibold uppercase tracking-[0.2em] text-silver-300 backdrop-blur-sm sm:text-[0.7rem]">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-crimson-500" />
            Nepal&apos;s immersive roleplay experience
          </p>

          <h1 id="hero-title" className="h-display mt-6 text-[clamp(3.5rem,9vw,8.4rem)] !leading-[0.86]">
            <span className="line-mask"><span className="hero-line bg-[linear-gradient(100deg,#f7f9fc_0%,#dfe7f2_45%,#a9bdd8_100%)] bg-clip-text text-transparent" style={{ ["--li" as string]: 0 }}>Chandra</span></span>
            <span className="line-mask"><span className="hero-line bg-[linear-gradient(100deg,#ef4a5c_0%,#dc143c_50%,#a30f2c_100%)] bg-clip-text text-transparent" style={{ ["--li" as string]: 1 }}>Surya</span></span>
            <span className="line-mask"><span className="hero-line text-[#f2f3f5]" style={{ ["--li" as string]: 2 }}>Roleplay</span></span>
          </h1>

          <p className="intro-up mt-6 flex items-center gap-3 font-display text-xl font-semibold uppercase tracking-[0.12em] text-snow sm:text-[1.45rem]" style={{ ["--d" as string]: "0.12s" }}>
            <span aria-hidden="true" className="h-px w-9 shrink-0 bg-gradient-to-r from-[#a9bdd8] to-crimson-500" />
            {serverConfig.tagline}
          </p>
          <p className="intro-up mt-4 max-w-[34rem] text-base leading-relaxed text-silver-300 sm:text-[1.05rem]" style={{ ["--d" as string]: "0.16s" }}>
            A community-driven FiveM city built around meaningful characters, active departments and stories shaped by its players.
          </p>

          <div className="intro-up mt-8 flex flex-col gap-3 sm:flex-row sm:items-center" style={{ ["--d" as string]: "0.22s" }}>
            <ButtonLink href="/applications?apply=whitelist" variant="crimson" size="lg" className="sm:min-w-[230px]">
              Apply for Whitelist <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
            </ButtonLink>
            <ButtonLink href={enterCityHref()} variant="light" size="lg">
              Enter the City
            </ButtonLink>
            <ButtonLink href={serverConfig.discordInvite} variant="discord" size="lg">
              <BrandIcon name="discord" size={18} /> Join Discord
            </ButtonLink>
          </div>

          <div className="intro-up mt-8" style={{ ["--d" as string]: "0.28s" }}>
            <HeroStatusPill initial={initial} />
          </div>
        </m.div>

        {/* RIGHT — Moon + Sun composition */}
        <m.div style={{ y: sceneY }} aria-hidden="true" className="relative mx-auto w-full max-w-[min(90vw,380px)] opacity-90 sm:max-w-[440px] sm:opacity-100 lg:max-w-[660px]">
          <div className="relative aspect-square">
            {/* orbit rings */}
            <svg viewBox="0 0 400 400" className="rays-turn absolute inset-0 h-full w-full opacity-70" style={{ animationDuration: "240s" }}>
              <circle cx="200" cy="200" r="196" fill="none" stroke="rgba(176,182,195,0.14)" strokeWidth="0.7" strokeDasharray="2 6" />
              <circle cx="200" cy="200" r="150" fill="none" stroke="rgba(176,182,195,0.08)" strokeWidth="0.7" />
              <circle cx="4" cy="200" r="2.2" fill="#a9bdd8" />
              <circle cx="396" cy="200" r="2.2" fill="#dc143c" />
            </svg>

            {/* orbiting particles */}
            <svg viewBox="0 0 400 400" className="orbit-slow absolute inset-0 h-full w-full">
              <circle cx="200" cy="50" r="1.6" fill="#dfe7f2" opacity="0.8" />
              <circle cx="350" cy="200" r="1.2" fill="#ff9a7a" opacity="0.7" />
              <circle cx="94" cy="306" r="1.1" fill="#a9bdd8" opacity="0.6" />
            </svg>
            <svg viewBox="0 0 400 400" className="orbit-slower absolute inset-0 h-full w-full">
              <circle cx="200" cy="8" r="1.3" fill="#ffd0b0" opacity="0.6" />
              <circle cx="20" cy="260" r="1.4" fill="#dfe7f2" opacity="0.7" />
            </svg>

            {/* SUN — Surya (back, upper right): soft bloom + heat haze instead of hard rays */}
            <m.div style={{ x: sunX, y: sunY }} className="absolute right-[-6%] top-[-4%] w-[64%]">
              <div className="relative aspect-square">
                <div className="absolute inset-[-55%] rounded-full bg-[radial-gradient(closest-side,rgba(220,20,60,0.16),rgba(255,110,60,0.05)_55%,transparent)]" />
                <div className="sun-rays absolute inset-[-30%] rounded-full [mask-image:radial-gradient(closest-side,transparent_38%,#000_48%,transparent_92%)]" />
                <div className="sun-haze absolute inset-[-22%] rounded-full bg-[radial-gradient(closest-side,rgba(255,120,70,0.35),rgba(220,20,60,0.16)_50%,transparent)] blur-xl" />
                <div className="sun-spin absolute inset-0"><Image src="/art/sun.webp" alt="" fill priority sizes="(min-width:1024px) 30vw, 60vw" className="object-contain mix-blend-screen [mask-image:radial-gradient(closest-side,#000_62%,transparent_98%)]" /></div>
                <div className="absolute inset-[16%] rounded-full bg-[radial-gradient(circle_at_42%_40%,rgba(255,236,210,0.28),transparent_55%)] mix-blend-screen" />
                {/* subtle flares */}
                <span className="sun-flare absolute left-[8%] top-[70%] h-1.5 w-1.5 rounded-full bg-[#ffb48a]" />
                <span className="sun-flare absolute right-[4%] top-[22%] h-1 w-1 rounded-full bg-[#ffd0b0]" style={{ animationDelay: "1.4s" }} />
                <span className="sun-flare absolute bottom-[2%] right-[30%] h-1 w-1 rounded-full bg-[#ff9a7a]" style={{ animationDelay: "2.6s" }} />
              </div>
            </m.div>

            {/* MOON — Chandra (front, lower left): lifted lit limb + cool rim */}
            <m.div style={{ x: moonX, y: moonY }} className="absolute bottom-[3%] left-[-4%] w-[60%]">
              <div className="moon-drift relative aspect-square">
                <div className="moon-breathe absolute inset-[-30%] rounded-full bg-[radial-gradient(closest-side,rgba(150,180,255,0.26),rgba(80,110,220,0.07)_55%,transparent)]" />
                <Image src="/art/moon.webp" alt="" fill priority sizes="(min-width:1024px) 30vw, 60vw" className="object-contain [filter:brightness(1.38)_contrast(1.06)_saturate(0.85)_drop-shadow(0_0_26px_rgba(160,190,255,0.35))]" />
                {/* rim light on the lit (right) limb */}
                <div className="absolute inset-[3%] rounded-full [background:radial-gradient(circle_closest-side,transparent_90%,rgba(214,228,255,0.55)_97%,transparent_100%)] [mask-image:linear-gradient(90deg,transparent_45%,#000_85%)]" />
                <div className="absolute inset-[3%] rounded-full shadow-[inset_-22px_0_40px_-18px_rgba(205,222,255,0.5)]" />
                {/* faint earthshine so the dark side separates from the sky */}
                <div className="absolute inset-[3%] rounded-full shadow-[inset_14px_0_40px_-20px_rgba(120,150,230,0.22)]" />
              </div>
            </m.div>

            {/* CSRP crest set into the orbit (free lower-right space; covers neither body) */}
            <m.div style={{ x: crestX, y: crestY }} className="absolute bottom-[5%] right-[3%] sm:bottom-[6%] sm:right-[5%]">
              <div className="crest-float relative rounded-[20px] border border-white/[0.12] bg-[linear-gradient(145deg,rgba(255,255,255,0.07),rgba(255,255,255,0.015))] p-2 shadow-[-10px_0_26px_-12px_rgba(140,170,255,0.65),10px_0_26px_-12px_rgba(220,20,60,0.65),0_18px_40px_-18px_rgba(0,0,0,0.9)] backdrop-blur-md sm:p-2.5">
                <CsrpCrest size={110} priority className="h-[72px] w-[72px] sm:h-[92px] sm:w-[92px] lg:h-[110px] lg:w-[110px]" />
              </div>
              <span className="mt-2 hidden text-center text-[0.56rem] font-semibold uppercase tracking-[0.3em] text-silver-400 sm:block">Est. Nepal</span>
            </m.div>

            {/* technical labels */}
            <span className="absolute bottom-[1%] left-[6%] hidden text-[0.58rem] font-semibold uppercase tracking-[0.26em] text-[#a9bdd8]/80 sm:block">Chandra · Moon</span>
            <span className="absolute right-[2%] top-[1%] hidden text-[0.58rem] font-semibold uppercase tracking-[0.26em] text-crimson-400/80 sm:block">Surya · Sun</span>
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
