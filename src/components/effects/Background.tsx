/**
 * Site-wide atmosphere (fixed behind everything), all CSS/SVG:
 *  1. dark base #050608 → #07090c
 *  2. soft blue glows top-left + mid-left (Chandra)
 *  3. soft crimson glows top-right + lower-right (Surya)
 *  4. sparse twinkling stars
 *  5. extremely faint technical grid
 *  6. film grain
 *  7. faint diagonal Nepal-inspired geometry (Dhaka-weave triangles)
 */
function stars(seed: number, n: number) {
  let s = seed;
  const r = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  return Array.from({ length: n }, () => ({ x: +(r() * 100).toFixed(2), y: +(r() * 100).toFixed(2), s: r() < 0.12 ? 1.4 : 0.8, t: +(3 + r() * 5).toFixed(2), d: +(r() * 5).toFixed(2), tw: r() < 0.35 }));
}

const NOISE =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.55 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")";

// Dhaka-style woven triangles, drawn as hairlines
const WEAVE =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'><g fill='none' stroke='white' stroke-width='0.6'><path d='M0 60 L30 30 L60 60 L30 90 Z'/><path d='M60 60 L90 30 L120 60 L90 90 Z'/><path d='M30 30 L60 0 L90 30'/><path d='M30 90 L60 120 L90 90'/><path d='M15 60 L30 45 L45 60 L30 75 Z'/><path d='M75 60 L90 45 L105 60 L90 75 Z'/></g></svg>\")";

export function Background() {
  const field = stars(11, 90);
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-50 overflow-hidden bg-[linear-gradient(180deg,#050608_0%,#07090c_55%,#050608_100%)]">
      {/* Chandra — cool blue */}
      <div className="tone-moon drift absolute -left-[18%] -top-[22%] h-[75vh] w-[70vw] rounded-full bg-[radial-gradient(closest-side,rgba(47,91,255,0.17),transparent)]" style={{ ["--t" as string]: "38s" }} />
      <div className="tone-moon absolute -left-[22%] top-[38%] h-[60vh] w-[50vw] rounded-full bg-[radial-gradient(closest-side,rgba(95,134,255,0.08),transparent)]" />
      {/* Surya — crimson */}
      <div className="tone-sun drift absolute -right-[16%] -top-[18%] h-[65vh] w-[55vw] rounded-full bg-[radial-gradient(closest-side,rgba(212,22,60,0.12),transparent)]" style={{ ["--t" as string]: "44s", animationDirection: "reverse" }} />
      <div className="tone-sun absolute -bottom-[26%] -right-[14%] h-[70vh] w-[65vw] rounded-full bg-[radial-gradient(closest-side,rgba(212,22,60,0.13),rgba(255,122,61,0.03)_60%,transparent)]" />
      {/* technical grid */}
      <div
        className="absolute inset-0 opacity-50 [mask-image:radial-gradient(ellipse_at_50%_35%,#000_10%,transparent_75%)]"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.028) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.028) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          animation: "grid-pan 22s linear infinite",
        }}
      />
      {/* diagonal Nepal geometry — two faint bands */}
      <div className="absolute -left-[10%] top-[14%] h-[34vh] w-[60vw] -rotate-[18deg] opacity-[0.035] [mask-image:linear-gradient(90deg,transparent,#000_30%,#000_70%,transparent)]" style={{ backgroundImage: WEAVE, backgroundSize: "96px 96px" }} />
      <div className="absolute -right-[12%] bottom-[8%] h-[30vh] w-[55vw] -rotate-[18deg] opacity-[0.03] [mask-image:linear-gradient(90deg,transparent,#000_30%,#000_70%,transparent)]" style={{ backgroundImage: WEAVE, backgroundSize: "96px 96px" }} />
      {/* stars */}
      <svg className="absolute inset-0 h-full w-full">
        {field.map((p, i) => (
          <circle key={i} cx={`${p.x}%`} cy={`${p.y}%`} r={p.s} fill="#dfe8ff" className={p.tw ? "twinkle" : undefined} opacity={p.tw ? undefined : 0.3} style={p.tw ? ({ ["--t" as string]: `${p.t}s`, ["--td" as string]: `${p.d}s` } as React.CSSProperties) : undefined} />
        ))}
      </svg>
      {/* film grain */}
      <div className="grain-drift absolute -inset-[64px] opacity-[0.05] mix-blend-overlay" style={{ backgroundImage: NOISE }} />
      {/* vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.45))]" />
    </div>
  );
}
