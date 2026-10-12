"use client";
import { m, useScroll, useSpring } from "motion/react";

/** 2px reading-progress line at the very top: cool blue → crimson. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.3 });
  return <m.div aria-hidden="true" style={{ scaleX }} className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-[2px] origin-left bg-gradient-to-r from-[#7e9cff] via-[#c9a3b8] to-crimson-500" />;
}
