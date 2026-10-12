"use client";
import { m, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef, type ReactNode } from "react";

/**
 * Scroll parallax (transform only). `speed` is the fraction of travel:
 * 0.1 = moves ±10% of its height across the viewport. Negative = opposite.
 * Disabled for reduced motion. Never changes visibility.
 */
export function Parallax({ children, speed = 0.12, className = "" }: { children: ReactNode; speed?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [`${-speed * 100}%`, `${speed * 100}%`]);
  return (
    <m.div ref={ref} style={reduced ? undefined : { y }} className={className}>
      {children}
    </m.div>
  );
}
