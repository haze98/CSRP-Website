"use client";
import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Lenis smooth scrolling (lerp 0.1). Disabled for reduced motion and
 * touch-first devices; paused while a modal is open.
 */
export function SmoothScroll() {
  const lenis = useRef<Lenis | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || window.matchMedia("(pointer: coarse)").matches) return;
    const l = new Lenis({ lerp: 0.1, anchors: { offset: -90 } });
    lenis.current = l;
    let raf = 0;
    const loop = (t: number) => {
      l.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    // stop while a modal / drawer is open
    const mo = new MutationObserver(() => (document.documentElement.dataset.modal ? l.stop() : l.start()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-modal"] });
    return () => {
      cancelAnimationFrame(raf);
      mo.disconnect();
      l.destroy();
      lenis.current = null;
    };
  }, []);

  useEffect(() => {
    if (!window.location.hash) lenis.current?.scrollTo(0, { immediate: true, force: true });
  }, [pathname]);

  return null;
}
