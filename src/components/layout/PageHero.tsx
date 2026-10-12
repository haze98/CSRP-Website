import type { ReactNode } from "react";
import { AnimatedHeading } from "@/components/motion/AnimatedHeading";

/**
 * Inner-page header: bracket tag, condensed two-line title, lede and an
 * optional aside. A faint moon-glow (left) and sun-glow (right) plus a thin
 * eclipse arc keep the Chandra/Surya identity without repeating the hero.
 */
export function PageHero({ tag, title, accent, lede, children, aside }: { tag: string; title: string; accent?: string; lede?: ReactNode; children?: ReactNode; aside?: ReactNode }) {
  return (
    <section className="relative overflow-hidden pb-14 pt-36 sm:pb-20 sm:pt-44">
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <div className="absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-[radial-gradient(closest-side,rgba(47,91,255,0.20),transparent)]" />
        <div className="absolute -right-48 top-10 h-[520px] w-[520px] rounded-full bg-[radial-gradient(closest-side,rgba(212,22,60,0.16),transparent)]" />
        <svg className="absolute right-[-120px] top-[60px] h-[420px] w-[420px] opacity-[0.12] sm:right-[4%]" viewBox="0 0 200 200" fill="none">
          <circle cx="100" cy="100" r="98" stroke="#b0b6c3" strokeWidth="0.5" strokeDasharray="1 4" />
          <circle cx="100" cy="100" r="70" stroke="#b0b6c3" strokeWidth="0.5" />
          <path d="M100 30 A70 70 0 0 1 100 170" stroke="url(#ph-arc)" strokeWidth="2" />
          <defs>
            <linearGradient id="ph-arc" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#5f86ff" />
              <stop offset="1" stopColor="#f04664" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>
      <div className="container-x">
        <div className={`flex flex-col gap-10 ${aside ? "lg:flex-row lg:items-end lg:justify-between" : ""}`}>
          <div className="max-w-3xl">
            <p className="tag intro-up">[ {tag} ]</p>
            <AnimatedHeading
              as="h1"
              className="h-display mt-5 text-[2.9rem] text-snow sm:text-7xl lg:text-[5.5rem]"
              lines={accent ? [title, <span key="a" className="bg-gradient-to-r from-[#dfe7f2] via-snow to-crimson-400 bg-clip-text text-transparent">{accent}</span>] : [title]}
            />
            {lede && (
              <p className="intro-up mt-6 max-w-2xl text-base leading-relaxed text-silver-300 sm:text-lg" style={{ ["--d" as string]: "0.12s" }}>
                {lede}
              </p>
            )}
            {children && (
              <div className="intro-up mt-8" style={{ ["--d" as string]: "0.18s" }}>
                {children}
              </div>
            )}
          </div>
          {aside && (
            <div className="intro-up shrink-0" style={{ ["--d" as string]: "0.2s" }}>
              {aside}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
