"use client";
import { useEffect, useRef } from "react";

/**
 * Moon + solar particles on one small canvas. Particles on the left drift
 * cold (blue-white), on the right warm (crimson/orange); the field leans
 * slightly toward the cursor. ≤48 on desktop, ≤16 on mobile, DPR ≤1.5,
 * paused when hidden/off-screen, disabled for reduced motion.
 */
export default function Particles({ className = "", count = 44 }: { className?: string; count?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current;
    if (!c || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const mobile = window.innerWidth < 768;
    const n = Math.min(count, mobile ? 16 : 48);
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    let w = 0, h = 0, raf = 0, visible = true, mx = 0, my = 0, ox = 0, oy = 0;
    type P = { x: number; y: number; r: number; vx: number; vy: number; a: number; tw: number; d: number };
    let ps: P[] = [];

    const resize = () => {
      const r = c.getBoundingClientRect();
      w = r.width;
      h = r.height;
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const seed = () =>
      (ps = Array.from({ length: n }, () => {
        const d = Math.random();
        return { x: Math.random() * w, y: Math.random() * h, r: 0.5 + d * 1.4, vx: (Math.random() - 0.5) * 0.1, vy: -(0.03 + Math.random() * 0.1), a: 0.25 + d * 0.55, tw: Math.random() * 6.28, d };
      }));

    const draw = () => {
      ox += (mx - ox) * 0.04;
      oy += (my - oy) * 0.04;
      ctx.clearRect(0, 0, w, h);
      for (const p of ps) {
        p.x += p.vx;
        p.y += p.vy;
        p.tw += 0.016;
        if (p.y < -8) { p.y = h + 8; p.x = Math.random() * w; }
        if (p.x < -8) p.x = w + 8;
        if (p.x > w + 8) p.x = -8;
        const px = p.x + ox * p.d * 14, py = p.y + oy * p.d * 10;
        const a = p.a * (0.6 + Math.sin(p.tw) * 0.4);
        const warm = px / w; // 0 left (moon) → 1 right (sun)
        const r = Math.round(200 + warm * 55), g = Math.round(220 - warm * 140), b = Math.round(255 - warm * 180);
        ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
        ctx.beginPath();
        ctx.arc(px, py, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    const start = () => { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(draw); };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };

    resize();
    seed();
    start();
    const ro = new ResizeObserver(resize);
    ro.observe(c);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) start(); else stop(); });
    io.observe(c);
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVis);
    const onMove = (e: PointerEvent) => { mx = (e.clientX / window.innerWidth) * 2 - 1; my = (e.clientY / window.innerHeight) * 2 - 1; };
    if (fine) window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pointermove", onMove);
    };
  }, [count]);

  return <canvas ref={ref} aria-hidden="true" className={`pointer-events-none absolute inset-0 h-full w-full ${className}`} />;
}
