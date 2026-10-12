"use client";
import { m, useScroll, useTransform } from "motion/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { CsrpCrest } from "@/components/brand/CsrpLogo";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { showcase, type ShowcaseItem } from "@/config/showcase";
import { SceneArt } from "./SceneArt";

/** Asymmetric editorial grid (lg): tall / short / tall / short checkerboard. */
const LAYOUT = ["lg:col-span-7 lg:row-span-5", "lg:col-span-5 lg:row-span-3", "lg:col-span-5 lg:row-span-5", "lg:col-span-7 lg:row-span-3"];

export function CityShowcase() {
  return (
    <section data-tone="moon" aria-labelledby="showcase-title" className="py-20 sm:py-28">
      <div className="mx-auto w-full max-w-[1440px] px-5 sm:px-8">
        <SectionHeader index="01" tag="Inside the city" id="showcase-title" title="One city." accent="Countless stories." lede="Every shift, deal and late-night drive is played by a real person. These are the lives waiting for you in Chandra Surya." />
        <div className="stagger mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:auto-rows-[92px] lg:grid-cols-12 lg:gap-5">
          {showcase.map((item, i) => (
            <ShowcaseCard key={item.n} item={item} className={LAYOUT[i % LAYOUT.length]} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ShowcaseCard({ item, className }: { item: ShowcaseItem; className: string }) {
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
          <ShowcaseMedia item={item} />
        </div>
      </m.div>
      {/* cinematic grade */}
      <m.div aria-hidden="true" style={{ opacity: shade }} className="absolute inset-0 bg-gradient-to-t from-[#050608] via-[#050608]/55 to-[#050608]/10" />
      <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,6,8,0.6),transparent_60%)]" />
      <m.div style={{ y: copyY }} className="relative flex h-full flex-col justify-between p-6 sm:p-8">
        <div className="flex items-start justify-between gap-3">
          <span className="font-display text-base font-semibold tracking-[0.22em] text-snow/85">{item.n}</span>
          {!item.media && <CsrpCrest size={44} className="h-10 w-10 opacity-70 transition-opacity group-hover:opacity-100" />}
        </div>
        <div className="max-w-md">
          <h3 className="h-display text-3xl text-snow sm:text-[2.6rem]">{item.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-silver-300 sm:text-[0.95rem]">{item.line}</p>
          <span aria-hidden="true" className="mt-4 block h-px w-10 bg-gradient-to-r from-crimson-400 to-transparent transition-[width] duration-500 group-hover:w-24" />
        </div>
      </m.div>
    </article>
  );
}

/** Image / video if configured and loadable; otherwise the original procedural scene. */
function ShowcaseMedia({ item }: { item: ShowcaseItem }) {
  const video = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const v = video.current;
    if (!v || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()), { threshold: 0.25 });
    io.observe(v);
    return () => io.disconnect();
  }, []);

  if (!item.media || failed) return <SceneArt kind={item.scene} className="h-full w-full" />;
  if (item.media.type === "image") return <Image src={item.media.src} alt="" fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" onError={() => setFailed(true)} />;
  return <video ref={video} className="h-full w-full object-cover" src={item.media.src} poster={item.media.poster} muted loop playsInline preload="metadata" aria-hidden="true" onError={() => setFailed(true)} />;
}
