"use client";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Active-section atmosphere: sections declare data-tone="moon" | "sun" |
 * "neutral"; the one nearest the viewport centre sets html[data-tone], and the
 * fixed background glows cross-fade (CSS transitions on opacity only).
 */
export function ToneObserver() {
  const path = usePathname();
  useEffect(() => {
    const html = document.documentElement;
    const els = [...document.querySelectorAll<HTMLElement>("[data-tone]")];
    if (!els.length) {
      html.dataset.tone = "neutral";
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (hit) html.dataset.tone = (hit.target as HTMLElement).dataset.tone ?? "neutral";
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.01] },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [path]);
  return null;
}
