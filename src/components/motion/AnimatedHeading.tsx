import type { ReactNode } from "react";

/**
 * Line-mask heading reveal: each line sits in an overflow-hidden mask and
 * slides up when the heading enters the viewport (staggered ~90ms).
 * Server-rendered fully visible; only pre-hidden once the inline reveal
 * script is active (see components/ui/Reveal.tsx), so it can never get stuck.
 */
export function AnimatedHeading({ as: Tag = "h2", lines, className = "", id, delay = 0 }: { as?: "h1" | "h2" | "h3" | "p"; lines: ReactNode[]; className?: string; id?: string; delay?: number }) {
  return (
    <Tag suppressHydrationWarning id={id} className={`reveal reveal-lines ${className}`} style={delay ? ({ ["--rd" as string]: `${delay}s` } as React.CSSProperties) : undefined}>
      {lines.map((line, i) => (
        <span key={i} className="line-mask">
          <span className="line-inner" style={{ ["--li" as string]: i } as React.CSSProperties}>
            {line}
          </span>
        </span>
      ))}
    </Tag>
  );
}
