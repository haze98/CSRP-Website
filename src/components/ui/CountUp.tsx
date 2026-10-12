"use client";
import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";

/**
 * Animated counter. The real value is server-rendered (correct without JS);
 * after hydration it counts up from 0 the first time it scrolls into view.
 * Renders "—" for null.
 */
export function CountUp({ value, decimals = 0, suffix = "", className = "" }: { value: number | null; decimals?: number; suffix?: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const reduced = useReducedMotion();
  const done = useRef(false);
  const fmt = (n: number) => `${n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`;

  useEffect(() => {
    const el = ref.current;
    if (!el || value === null) return;
    if (reduced || done.current) {
      el.textContent = fmt(value);
      return;
    }
    if (!inView) return;
    done.current = true;
    const c = animate(0, value, { duration: 1.4, ease: [0.22, 1, 0.36, 1], onUpdate: (v) => (el.textContent = fmt(v)) });
    return () => c.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, value, reduced]);

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {value === null ? "—" : fmt(value)}
    </span>
  );
}
