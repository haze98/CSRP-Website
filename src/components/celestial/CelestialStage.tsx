"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { SceneSignals } from "./CelestialScene";

// three.js + R3F are only downloaded when the CTA approaches the viewport.
const CelestialScene = dynamic(() => import("./CelestialScene"), { ssr: false, loading: () => null });

type Tier = "pending" | "3d" | "static";

/** Phones, tablets, reduced motion, data saver, weak CPUs or no WebGL → static fallback. */
function pickTier(): Tier {
  try {
    const mq = (q: string) => window.matchMedia(q).matches;
    if (mq("(prefers-reduced-motion: reduce)") || mq("(pointer: coarse)") || !mq("(hover: hover)")) return "static";
    if (window.innerWidth < 900) return "static";
    const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
    if (nav.connection?.saveData || (nav.hardwareConcurrency && nav.hardwareConcurrency < 4) || (nav.deviceMemory && nav.deviceMemory < 4)) return "static";
    const gl = document.createElement("canvas").getContext("webgl2");
    if (!gl) return "static";
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return "3d";
  } catch {
    return "static";
  }
}

/**
 * Background stage for the closing CTA. Server-renders the static celestial
 * gradient (always visible, no JS needed); on capable desktops the 3D Sun /
 * Moon / crest scene is lazy-loaded near the viewport and cross-fades in.
 * Rendering pauses while the section is off-screen or the tab is hidden.
 */
export function CelestialStage() {
  const root = useRef<HTMLDivElement>(null);
  const canvasWrap = useRef<HTMLDivElement>(null);
  const [tier, setTier] = useState<Tier>("pending");
  const [near, setNear] = useState(false);
  const [onScreen, setOnScreen] = useState(false);
  const [visible, setVisible] = useState(true);
  const [ready, setReady] = useState(false);
  const progress = useRef(0);
  const pointer = useRef({ x: 0, y: 0 });
  const signals = useRef<SceneSignals>({ progress, pointer }).current;
  const remeasure = useRef<() => void>(() => {});

  useEffect(() => setTier(pickTier()), []);

  useEffect(() => {
    const el = root.current;
    if (!el || tier !== "3d") return;
    const nearIo = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: "900px 0px" });
    const onIo = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { rootMargin: "120px 0px" });
    nearIo.observe(el);
    onIo.observe(el);
    const vis = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", vis);

    // scroll progress: 0 when the section top meets the viewport bottom → 1 when centred
    let raf = 0;
    const measure = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.5 + r.height * 0.5)));
      progress.current = p;
      if (canvasWrap.current) canvasWrap.current.style.setProperty("--reveal", String(Math.min(1, p * 1.5)));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    measure();
    remeasure.current = measure;
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      nearIo.disconnect();
      onIo.disconnect();
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", vis);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("pointermove", onMove);
    };
  }, [tier]);

  const show3d = tier === "3d" && near;
  // the wrapper mounts after the scroll that revealed it (e.g. an anchor jump) — measure again
  useEffect(() => remeasure.current(), [show3d, ready]);

  return (
    <div ref={root} aria-hidden="true" className="absolute inset-0">
      <StaticCelestial dim={ready} />
      {show3d && (
        <div
          ref={canvasWrap}
          className="absolute inset-0 transition-opacity duration-[1400ms] ease-out"
          style={{ opacity: ready ? "var(--reveal, 0)" : 0 }}
        >
          <CelestialScene signals={signals} active={onScreen && visible} onReady={() => setReady(true)} />
        </div>
      )}
    </div>
  );
}

/**
 * Static celestial gradient — the mobile / reduced-motion / no-WebGL view and
 * the placeholder before the 3D scene arrives. Pure CSS, no imagery.
 */
function StaticCelestial({ dim }: { dim: boolean }) {
  // once the 3D scene is live, only the ambient glows remain (no duplicate bodies / orbit)
  const body = `transition-opacity duration-1000 ${dim ? "opacity-0" : "opacity-75"}`;
  return (
    <div className={`absolute inset-0 transition-opacity duration-1000 ${dim ? "opacity-60" : "opacity-100"}`}>
      {/* Surya: warm corona at the right */}
      <div className="cta-sun-glow absolute right-[-12%] top-1/2 h-[min(900px,130%)] w-[min(900px,70%)] -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,150,80,0.30),rgba(220,20,60,0.14)_40%,rgba(220,20,60,0.04)_65%,transparent)]" />
      <div className={`${body} absolute right-[12%] top-1/2 hidden h-28 w-28 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_40%_40%,#ffd9a0,#ff7a3d_45%,#c21a2a_80%,#5a0610)] shadow-[0_0_80px_20px_rgba(255,110,60,0.35),0_0_200px_60px_rgba(220,20,60,0.18)] sm:block`} />
      {/* Chandra: cool light at the left */}
      <div className="cta-moon-glow absolute left-[-14%] top-[-10%] h-[120%] w-[60%] rounded-full bg-[radial-gradient(closest-side,rgba(95,134,255,0.20),rgba(47,91,255,0.05)_55%,transparent)]" />
      <div className={`${body} absolute left-[14%] top-[30%] hidden h-14 w-14 rounded-full bg-[radial-gradient(circle_at_68%_40%,#e9edf5,#a3a7b0_45%,#4d5058_75%,#1d1f24)] shadow-[0_0_40px_6px_rgba(150,180,255,0.18)] sm:block`} />
      {/* faint orbit */}
      <svg viewBox="0 0 1600 600" preserveAspectRatio="none" className={`${body} absolute inset-0 h-full w-full`}>
        <defs>
          <linearGradient id="cta-orbit" x1="0" x2="1">
            <stop offset="0" stopColor="#5f86ff" stopOpacity="0.32" />
            <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.06" />
            <stop offset="1" stopColor="#dc143c" stopOpacity="0.32" />
          </linearGradient>
        </defs>
        <ellipse cx="900" cy="300" rx="700" ry="150" fill="none" stroke="url(#cta-orbit)" strokeWidth="1" />
      </svg>
    </div>
  );
}
