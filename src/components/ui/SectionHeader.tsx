import type { ReactNode } from "react";
import { AnimatedHeading } from "@/components/motion/AnimatedHeading";
import { Reveal } from "./Reveal";

/**
 * Section header: number + bracketed label (slides in), condensed display
 * heading with a line-mask reveal, then the lede (fade + rise).
 */
export function SectionHeader({
  index,
  tag,
  title,
  accent,
  lede,
  align = "left",
  action,
  id,
}: {
  index?: string;
  tag: string;
  title: string;
  /** Optional second heading line in the accent colour. */
  accent?: string;
  lede?: ReactNode;
  align?: "left" | "center";
  action?: ReactNode;
  id?: string;
}) {
  const center = align === "center";
  const lines: ReactNode[] = [title];
  if (accent) lines.push(<span key="a" className="bg-gradient-to-r from-[#dfe7f2] via-snow to-crimson-400 bg-clip-text text-transparent">{accent}</span>);
  return (
    <div className={`flex flex-col gap-6 ${center ? "items-center text-center" : "lg:flex-row lg:items-end lg:justify-between"}`}>
      <div className="max-w-3xl">
        <Reveal className={`reveal-label flex items-center gap-3 ${center ? "justify-center" : ""}`}>
          {index && <span className="font-display text-sm font-semibold text-crimson-400">{index}</span>}
          <span className="tag">[ {tag} ]</span>
          <span aria-hidden="true" className="hidden h-px w-16 bg-gradient-to-r from-white/20 to-transparent sm:block" />
        </Reveal>
        <AnimatedHeading id={id} lines={lines} className="h-display mt-4 text-[2.6rem] text-snow sm:text-6xl lg:text-[4.25rem]" />
        {lede && (
          <Reveal delay={0.15}>
            <p className={`mt-5 text-base leading-relaxed text-silver-300 sm:text-[1.05rem] ${center ? "mx-auto max-w-xl" : "max-w-xl"}`}>{lede}</p>
          </Reveal>
        )}
      </div>
      {action && <Reveal className="shrink-0">{action}</Reveal>}
    </div>
  );
}
