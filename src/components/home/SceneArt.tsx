import type { SceneKind } from "@/config/showcase";

/**
 * Original procedural city scenes used as placeholders until the community's
 * own screenshots are added. Deterministic (seeded), SVG-only, a few KB each.
 */
const PALETTES: Record<SceneKind, { sky: [string, string, string]; build: string; win: string[]; glow: string; seed: number; far: string }> = {
  story: { sky: ["#05070f", "#0d1838", "#1b2f6b"], build: "#04050a", win: ["#c4d8ff", "#7e9cff"], glow: "rgba(95,134,255,0.55)", seed: 3, far: "#13204a" },
  serve: { sky: ["#04050a", "#0a1230", "#14112a"], build: "#030408", win: ["#9fb6ff", "#ffffff"], glow: "rgba(47,91,255,0.5)", seed: 7, far: "#101838" },
  empire: { sky: ["#07060a", "#1c1209", "#3a2210"], build: "#050404", win: ["#ffcf8a", "#ff9a52"], glow: "rgba(255,150,70,0.45)", seed: 11, far: "#2c1c10" },
  streets: { sky: ["#060306", "#1b0710", "#3a0b1b"], build: "#040205", win: ["#f04664", "#ff7a3d"], glow: "rgba(212,22,60,0.55)", seed: 17, far: "#2c0c18" },
  legacy: { sky: ["#0a0406", "#4a0f1c", "#d4513a"], build: "#0a0507", win: ["#ffd2a8"], glow: "rgba(255,122,61,0.6)", seed: 23, far: "#3a1418" },
  night: { sky: ["#030306", "#0b0d22", "#26113a"], build: "#030307", win: ["#c4d8ff", "#f04664", "#ffcf8a"], glow: "rgba(150,90,255,0.4)", seed: 29, far: "#1a1442" },
};

function rng(seed: number) {
  let s = seed * 9301 + 49297;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

function skyline(seed: number, base: number, minH: number, maxH: number, W = 400) {
  const r = rng(seed);
  const out: { x: number; w: number; h: number; spire: boolean }[] = [];
  let x = -10;
  while (x < W + 10) {
    const w = 16 + r() * 34;
    const h = minH + Math.pow(r(), 1.6) * (maxH - minH);
    out.push({ x, w, h, spire: r() < 0.12 });
    x += w + r() * 3;
  }
  return out.map((b) => ({ ...b, y: base - b.h }));
}

export function SceneArt({ kind, className = "" }: { kind: SceneKind; className?: string }) {
  const p = PALETTES[kind];
  const r = rng(p.seed + 100);
  const id = `sc-${kind}`;
  const far = skyline(p.seed, 228, 30, kind === "empire" ? 150 : 95);
  const near = skyline(p.seed + 5, 250, 20, kind === "empire" ? 190 : kind === "legacy" ? 60 : 120);
  const windows: { x: number; y: number; c: string; o: number }[] = [];
  for (const b of near) {
    for (let wy = b.y + 6; wy < 246; wy += 7) {
      for (let wx = b.x + 3; wx < b.x + b.w - 4; wx += 5) {
        const lit = kind === "night" ? 0.32 : kind === "legacy" ? 0.06 : 0.16;
        if (r() < lit) windows.push({ x: wx, y: wy, c: p.win[Math.floor(r() * p.win.length)], o: 0.35 + r() * 0.6 });
      }
    }
  }
  return (
    <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.sky[0]} />
          <stop offset="0.6" stopColor={p.sky[1]} />
          <stop offset="1" stopColor={p.sky[2]} />
        </linearGradient>
        <linearGradient id={`${id}-haze`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.glow} stopOpacity="0" />
          <stop offset="1" stopColor={p.glow} stopOpacity="0.5" />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="0.5" cy="1" r="0.8">
          <stop offset="0" stopColor={p.glow} />
          <stop offset="1" stopColor="transparent" />
        </radialGradient>
      </defs>
      <rect width="400" height="300" fill={`url(#${id}-sky)`} />

      {/* celestial accents */}
      {(kind === "story" || kind === "night" || kind === "serve") && (
        <g>
          {Array.from({ length: 40 }, (_, i) => (
            <circle key={i} cx={r() * 400} cy={r() * 140} r={r() < 0.1 ? 0.9 : 0.5} fill="#dfe8ff" opacity={0.3 + r() * 0.5} />
          ))}
          {kind === "story" && (
            <g>
              <circle cx="318" cy="62" r="26" fill="#dfe8ff" opacity="0.92" />
              <circle cx="306" cy="56" r="24" fill={p.sky[0]} opacity="0.94" />
              <circle cx="318" cy="62" r="60" fill="rgba(160,190,255,0.08)" />
            </g>
          )}
        </g>
      )}
      {kind === "legacy" && (
        <g>
          <circle cx="200" cy="232" r="70" fill="rgba(255,122,61,0.18)" />
          <circle cx="200" cy="232" r="38" fill="#ff8a4a" opacity="0.85" />
          {/* Himalayan ridge */}
          <path d="M0 210 L40 182 L62 194 L104 150 L128 170 L160 138 L188 162 L214 128 L246 166 L276 146 L306 176 L342 150 L372 178 L400 164 L400 300 L0 300 Z" fill="#1d0a10" />
        </g>
      )}
      <rect width="400" height="300" fill={`url(#${id}-glow)`} />

      {/* far skyline */}
      <g fill={p.far}>
        {far.map((b, i) => (
          <rect key={i} x={b.x} y={b.y} width={b.w} height={300 - b.y} />
        ))}
      </g>
      <rect y="150" width="400" height="100" fill={`url(#${id}-haze)`} />
      {/* near skyline */}
      <g fill={p.build}>
        {near.map((b, i) => (
          <g key={i}>
            <rect x={b.x} y={b.y} width={b.w} height={300 - b.y} />
            {b.spire && <rect x={b.x + b.w / 2 - 1} y={b.y - 16} width="2" height="16" />}
            <rect x={b.x} y={b.y} width={b.w} height="1" fill={p.sky[2]} opacity="0.6" />
          </g>
        ))}
      </g>
      <g>
        {windows.map((w, i) => (
          <rect key={i} x={w.x} y={w.y} width="2.2" height="3" fill={w.c} opacity={w.o} />
        ))}
      </g>

      {/* ground & per-scene motion */}
      <rect y="250" width="400" height="50" fill="#020203" />
      {(kind === "streets" || kind === "night") && (
        <g>
          <path d="M150 300 L196 250 L204 250 L250 300 Z" fill="#0a0a0f" />
          <line x1="200" y1="252" x2="200" y2="300" stroke="#f4f5f7" strokeOpacity="0.35" strokeWidth="1.2" strokeDasharray="5 6" className="scene-road" />
          <path d="M0 278 C120 266 280 266 400 278" stroke={kind === "night" ? "#ff5a4a" : "#f04664"} strokeOpacity="0.7" strokeWidth="1.4" fill="none" strokeDasharray="30 50" className="scene-trail" />
          <path d="M0 286 C120 274 280 274 400 286" stroke="#fff3d6" strokeOpacity="0.6" strokeWidth="1.2" fill="none" strokeDasharray="20 60" className="scene-trail scene-trail-r" />
        </g>
      )}
      {kind === "serve" && (
        <g>
          <ellipse cx="140" cy="262" rx="120" ry="30" fill="#2f5bff" className="scene-strobe-a" />
          <ellipse cx="260" cy="262" rx="120" ry="30" fill="#d4163c" className="scene-strobe-b" />
        </g>
      )}
    </svg>
  );
}
