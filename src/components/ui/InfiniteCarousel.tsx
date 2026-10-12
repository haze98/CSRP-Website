"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Seamless auto-scrolling row. Children are rendered twice and the track
 * translates by exactly one copy, so the loop has no visible seam. Pauses on
 * hover / keyboard focus / when off-screen, and becomes a plain swipeable
 * row for reduced motion. The duplicate copy is hidden from assistive tech.
 */
export function InfiniteCarousel({ children, speed = 40, className = "", label }: { children: ReactNode[]; speed?: number; className?: string; label: string }) {
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [dur, setDur] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = track.current;
    if (!t) return;
    const measure = () => setDur(t.scrollWidth / 2 / speed);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(t);
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    if (root.current) io.observe(root.current);
    return () => {
      ro.disconnect();
      io.disconnect();
    };
  }, [speed, children.length]);

  return (
    <div ref={root} role="region" aria-label={label} className={`group/car relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_6%,#000_94%,transparent)] motion-reduce:overflow-x-auto motion-reduce:[mask-image:none] ${className}`}>
      <div
        ref={track}
        className={`flex w-max group-hover/car:[animation-play-state:paused] group-focus-within/car:[animation-play-state:paused] motion-reduce:!animate-none ${visible ? "" : "[animation-play-state:paused]"}`}
        // longhands only, so the pause classes can still set animation-play-state
        style={dur ? { animationName: "marquee", animationDuration: `${dur.toFixed(1)}s`, animationTimingFunction: "linear", animationIterationCount: "infinite" } : undefined}
      >
        {children.map((c, i) => (
          <div key={`a${i}`} className="shrink-0 pr-5">
            {c}
          </div>
        ))}
        {children.map((c, i) => (
          <div key={`b${i}`} className="shrink-0 pr-5 motion-reduce:hidden" aria-hidden="true" inert>
            {c}
          </div>
        ))}
      </div>
    </div>
  );
}
