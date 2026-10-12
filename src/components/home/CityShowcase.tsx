"use client";
import { m, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { CinematicMedia } from "@/components/media/CinematicMedia";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { MediaSlotKey, ResolvedMedia } from "@/config/media";
import { showcase, type ShowcaseItem } from "@/config/showcase";

/** Asymmetric editorial grid (lg): tall / short / tall / short checkerboard. */
const LAYOUT = ["lg:col-span-7 lg:row-span-5", "lg:col-span-5 lg:row-span-3", "lg:col-span-5 lg:row-span-5", "lg:col-span-7 lg:row-span-3"];

export function CityShowcase({ media }: { media: Record<MediaSlotKey, ResolvedMedia> }) {
  return (
    <section data-tone="moon" aria-labelledby="showcase-title" className="py-20 sm:py-28">
      <div className="mx-auto w-full max-w-[1440px] px-5 sm:px-8">
        <SectionHeader index="01" tag="Inside the city" id="showcase-title" title="One city." accent="Countless stories." lede="Every shift, deal and late-night drive is played by a real person. These are the lives waiting for you in Chandra Surya." />
        <div className="stagger mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:auto-rows-[92px] lg:grid-cols-12 lg:gap-5">
          {showcase.map((item, i) => (
            <ShowcaseCard key={item.n} item={item} media={media[item.media]} className={LAYOUT[i % LAYOUT.length]} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ShowcaseCard({ item, media, className }: { item: ShowcaseItem; media: ResolvedMedia; className: string }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [-22, 22]);
  // cinematic scroll: media eases in scale, overlay lightens at centre, copy drifts against the image
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1.12, 1.0, 1.06]);
  const shade = useTransform(scrollYProgress, [0, 0.5, 1], [0.85, 0.5, 0.8]);
  const copyY = useTransform(scrollYProgress, [0, 0.5, 1], [18, 0, -12]);

  const onMove = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--px", (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
    e.currentTarget.style.setProperty("--py", (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
  };
  const onLeave = (e: React.PointerEvent<HTMLElement>) => {
    e.currentTarget.style.setProperty("--px", "0");
    e.currentTarget.style.setProperty("--py", "0");
  };

  return (
    <article
      suppressHydrationWarning
      ref={ref}
      data-glow=""
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={`reveal reveal-media group relative aspect-[4/3] min-h-[260px] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0c12] lg:aspect-auto lg:min-h-0 ${className}`}
    >
      {/* media layer: scroll parallax + pointer parallax + hover zoom */}
      <m.div style={{ y, scale }} className="absolute inset-[-30px]">
        <div className="h-full w-full scale-[1.04] transition-transform duration-[900ms] ease-[cubic-bezier(.22,1,.36,1)] [translate:calc(var(--px,0)*-10px)_calc(var(--py,0)*-8px)] group-hover:scale-[1.1]">
          <CinematicMedia media={media} tint sizes="(min-width:1024px) 60vw, (min-width:640px) 50vw, 100vw" />
        </div>
      </m.div>
      {/* cinematic grade */}
      <m.div aria-hidden="true" style={{ opacity: shade }} className="absolute inset-0 bg-gradient-to-t from-[#050608] via-[#050608]/55 to-[#050608]/10" />
      <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,6,8,0.6),transparent_60%)]" />
      {/* red / blue edge light on hover */}
      <div aria-hidden="true" className={`pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 ${item.accent === "red" ? "bg-[radial-gradient(70%_60%_at_0%_100%,rgba(220,20,60,0.28),transparent_70%)]" : "bg-[radial-gradient(70%_60%_at_100%_100%,rgba(47,91,255,0.30),transparent_70%)]"}`} />
      <div aria-hidden="true" className={`pointer-events-none absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-x-100 ${item.accent === "red" ? "bg-gradient-to-r from-crimson-500 via-crimson-400/60 to-transparent" : "bg-gradient-to-r from-royal-400 via-royal-400/60 to-transparent"}`} />
      <m.div style={{ y: copyY }} className="relative flex h-full flex-col justify-between p-6 sm:p-8">
        <span className="font-display text-base font-semibold tracking-[0.22em] text-snow/85">{item.n}</span>
        <div className="max-w-md">
          <h3 className="h-display text-3xl text-snow sm:text-[2.6rem]">{item.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-silver-300 sm:text-[0.95rem]">{item.line}</p>
          <span aria-hidden="true" className="mt-4 block h-px w-10 bg-gradient-to-r from-crimson-400 to-transparent transition-[width] duration-500 group-hover:w-24" />
        </div>
      </m.div>
    </article>
  );
}
