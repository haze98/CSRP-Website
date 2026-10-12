"use client";
import { useEffect } from "react";

/**
 * One delegated pointer listener for the whole site:
 *  - [data-glow]: border glow / light follows the cursor (--mx/--my)
 *  - [data-magnetic]: element leans up to 6px toward the cursor (--tx/--ty)
 * Fine pointers only; magnetism disabled for reduced motion.
 */
export function PointerLayer() {
  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let last: PointerEvent | null = null;
    let mag: HTMLElement | null = null;

    const frame = () => {
      raf = 0;
      const e = last;
      if (!e) return;
      const t = e.target as Element | null;
      const glow = t?.closest?.<HTMLElement>("[data-glow]");
      if (glow) {
        const r = glow.getBoundingClientRect();
        glow.style.setProperty("--mx", `${e.clientX - r.left}px`);
        glow.style.setProperty("--my", `${e.clientY - r.top}px`);
      }
      const next = reduced ? null : (t?.closest?.<HTMLElement>("[data-magnetic]") ?? null);
      if (mag && mag !== next) {
        mag.style.setProperty("--tx", "0px");
        mag.style.setProperty("--ty", "0px");
      }
      mag = next;
      if (mag) {
        const r = mag.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        // "soft" (nav links): max 2px; default (buttons): max 6px / 4px
        const soft = mag.dataset.magnetic === "soft";
        const mx = soft ? 2 : 6, my = soft ? 1.5 : 4;
        mag.style.setProperty("--tx", `${Math.max(-mx, Math.min(mx, dx * (soft ? 0.06 : 0.18))).toFixed(1)}px`);
        mag.style.setProperty("--ty", `${Math.max(-my, Math.min(my, dy * (soft ? 0.08 : 0.22))).toFixed(1)}px`);
      }
    };
    const onMove = (e: PointerEvent) => {
      last = e;
      if (!raf) raf = requestAnimationFrame(frame);
    };
    document.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("pointermove", onMove);
    };
  }, []);
  return null;
}
