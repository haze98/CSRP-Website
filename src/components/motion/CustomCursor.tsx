"use client";
import { useEffect, useRef, useState } from "react";

const INTERACTIVE = 'a,button,[role="button"],[role="tab"],[role="radio"],[role="menuitem"],select,summary,label[for],input[type="checkbox"],input[type="radio"],[data-cursor],[data-glow]';
const TEXT = 'input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]),textarea,[contenteditable="true"]';

type P = { x: number; y: number; vx: number; vy: number; r: number; born: number; life: number; hot: boolean };

const MAX_PARTICLES = 48;
const rand = (a: number, b: number) => a + Math.random() * (b - a);

/**
 * Minimal red particle cursor (precise mouse only — off for touch, pens,
 * tablets and reduced motion, where the native cursor is used).
 * A tiny red point marks the hotspot; moving sheds 2–5 small particles that
 * drift outward, shrink and fade in 300–600ms; a click releases a small
 * burst of 4–6. Over buttons/links the particles burn brighter. No rings.
 * One canvas, and the animation loop only runs while something is moving.
 */
export function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const dot = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setEnabled(fine.matches && !reduced.matches && navigator.maxTouchPoints === 0);
    update();
    fine.addEventListener("change", update);
    reduced.addEventListener("change", update);
    return () => {
      fine.removeEventListener("change", update);
      reduced.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    const cv = canvas.current;
    const ctx = cv?.getContext("2d");
    if (!enabled || !cv || !ctx) {
      html.classList.remove("has-cursor");
      return;
    }
    html.classList.add("has-cursor");

    const parts: P[] = [];
    let raf = 0;
    let dpr = 1;
    let last: { x: number; y: number } | null = null;
    let travel = 0;
    let hot = false;
    let hidden = true;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(window.innerWidth * dpr);
      cv.height = Math.round(window.innerHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const spawn = (x: number, y: number, n: number, opts: { speed: [number, number]; dir?: { x: number; y: number } }) => {
      for (let i = 0; i < n && parts.length < MAX_PARTICLES; i++) {
        let a = rand(0, Math.PI * 2);
        // trail particles lean away from the direction of travel
        if (opts.dir) a = Math.atan2(-opts.dir.y, -opts.dir.x) + rand(-1.3, 1.3);
        const s = rand(...opts.speed);
        parts.push({ x: x + rand(-2, 2), y: y + rand(-2, 2), vx: Math.cos(a) * s, vy: Math.sin(a) * s, r: rand(1, 2.5), born: performance.now(), life: rand(300, 600), hot });
      }
      if (!raf) raf = requestAnimationFrame(frame);
    };

    const frame = (now: number) => {
      raf = 0;
      ctx.clearRect(0, 0, cv.width / dpr, cv.height / dpr);
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        const t = (now - p.born) / p.life;
        if (t >= 1) {
          parts.splice(i, 1);
          continue;
        }
        const dt = 1 / 60;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.94;
        p.vy *= 0.94;
        const k = 1 - t;
        ctx.globalAlpha = (p.hot ? 0.95 : 0.7) * k * k;
        ctx.fillStyle = p.hot ? "#ff4d6d" : "#dc143c";
        ctx.shadowColor = p.hot ? "rgba(255,77,109,0.9)" : "rgba(220,20,60,0.6)";
        ctx.shadowBlur = p.hot ? 8 : 4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.2, p.r * (0.35 + 0.65 * k)), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      if (parts.length) raf = requestAnimationFrame(frame);
    };

    const setDot = (x: number, y: number, show: boolean) => {
      const d = dot.current;
      if (!d) return;
      d.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${hot ? 1.35 : 1})`;
      d.style.opacity = show ? "1" : "0";
      d.dataset.hot = hot ? "1" : "";
    };

    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const t = e.target as Element | null;
      const inText = !!t?.closest?.(TEXT);
      hot = !inText && !!t?.closest?.(INTERACTIVE);
      hidden = inText;
      setDot(e.clientX, e.clientY, !inText);
      if (last && !inText) {
        const dx = e.clientX - last.x, dy = e.clientY - last.y;
        travel += Math.hypot(dx, dy);
        // ~one small cluster per 28px travelled → a light trail, never a stream
        if (travel > 28) {
          travel = 0;
          spawn(e.clientX, e.clientY, Math.round(rand(2, 5)), { speed: [12, 42], dir: { x: dx, y: dy } });
        }
      }
      last = { x: e.clientX, y: e.clientY };
    };
    const press = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || hidden) return;
      spawn(e.clientX, e.clientY, Math.round(rand(4, 6)), { speed: [40, 90] });
    };
    const leave = () => {
      last = null;
      if (dot.current) dot.current.style.opacity = "0";
    };

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", press, { passive: true });
    window.addEventListener("resize", resize, { passive: true });
    html.addEventListener("pointerleave", leave);
    window.addEventListener("blur", leave);
    return () => {
      cancelAnimationFrame(raf);
      html.classList.remove("has-cursor");
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", press);
      window.removeEventListener("resize", resize);
      html.removeEventListener("pointerleave", leave);
      window.removeEventListener("blur", leave);
    };
  }, [enabled]);

  if (!enabled) return null;
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[150]">
      <canvas ref={canvas} className="absolute inset-0 h-full w-full" />
      <span
        ref={dot}
        className="absolute -left-[2.5px] -top-[2.5px] h-[5px] w-[5px] rounded-full bg-[#ff2d55] opacity-0 shadow-[0_0_0_1px_rgba(255,255,255,0.35),0_0_8px_rgba(255,45,85,0.85)] transition-[opacity,box-shadow] duration-150 will-change-transform data-[hot=1]:shadow-[0_0_0_1px_rgba(255,255,255,0.5),0_0_14px_rgba(255,77,109,1)]"
      />
    </div>
  );
}
