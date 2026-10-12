"use client";
import { Table2 } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import type { SeriesPoint } from "@/types";

/**
 * Single-series charts for the status dashboard (validated palette:
 * royal #5f86ff / crimson #f04664 on #0b0c10). One hue per chart, no legend
 * box (the title names the series), 2px lines, rounded bar ends, recessive
 * grid, hover tooltip/crosshair, and a data-table view for accessibility.
 */
export type ChartColor = "royal" | "crimson";
const COLORS: Record<ChartColor, string> = { royal: "#5f86ff", crimson: "#f04664" };

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

function niceMax(v: number) {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
}

export function ChartCard({
  title,
  subtitle,
  data,
  kind,
  color = "royal",
  format = (v) => v.toLocaleString("en-US"),
  label,
  minY,
  maxY,
  footer,
}: {
  title: string;
  subtitle?: string;
  data: SeriesPoint[];
  kind: "area" | "bar";
  color?: ChartColor;
  format?: (v: number) => string;
  label: (t: string) => string;
  minY?: number;
  maxY?: number;
  footer?: ReactNode;
}) {
  const [showTable, setShowTable] = useState(false);
  return (
    <figure className="card p-5 sm:p-6">
      <figcaption className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-lg font-semibold uppercase tracking-wide text-snow">{title}</p>
          {subtitle && <p className="mt-0.5 text-xs text-silver-500">{subtitle}</p>}
        </div>
        <button
          type="button"
          onClick={() => setShowTable((s) => !s)}
          aria-pressed={showTable}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-white/10 px-2.5 py-1.5 text-xs text-silver-400 transition-colors hover:text-snow aria-pressed:border-white/25 aria-pressed:text-snow"
        >
          <Table2 size={13} aria-hidden="true" /> {showTable ? "Chart" : "Table"}
        </button>
      </figcaption>
      <div className="mt-5">
        {data.length === 0 ? (
          <p className="grid h-[180px] place-items-center text-sm text-silver-500">No data recorded yet.</p>
        ) : showTable ? (
          <div className="max-h-[220px] overflow-auto rounded-lg border border-white/[0.06]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-panel text-left text-xs uppercase tracking-wider text-silver-500">
                <tr>
                  <th className="px-3 py-2 font-semibold">Time</th>
                  <th className="px-3 py-2 text-right font-semibold">Value</th>
                </tr>
              </thead>
              <tbody>
                {data.map((d) => (
                  <tr key={d.t} className="border-t border-white/[0.05]">
                    <td className="px-3 py-1.5 text-silver-300">{label(d.t)}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-snow">{format(d.v)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : kind === "area" ? (
          <AreaPlot data={data} color={COLORS[color]} format={format} label={label} minY={minY} maxY={maxY} />
        ) : (
          <BarPlot data={data} color={COLORS[color]} format={format} label={label} />
        )}
      </div>
      {footer && <div className="mt-4 border-t border-white/[0.06] pt-3 text-xs text-silver-500">{footer}</div>}
    </figure>
  );
}

const H = 190;
const PAD = { l: 46, r: 10, t: 12, b: 24 };

function Grid({ w, max, min, format }: { w: number; max: number; min: number; format: (v: number) => string }) {
  const ticks = [0, 0.5, 1].map((f) => min + (max - min) * f);
  const y = (v: number) => PAD.t + (1 - (v - min) / (max - min || 1)) * (H - PAD.t - PAD.b);
  return (
    <g>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={PAD.l} x2={w - PAD.r} y1={y(t)} y2={y(t)} stroke="rgba(255,255,255,0.06)" />
          <text x={PAD.l - 8} y={y(t) + 3.5} textAnchor="end" fontSize="10" fill="#6c7382">
            {format(t)}
          </text>
        </g>
      ))}
    </g>
  );
}

function Tooltip({ x, y, w, title, value }: { x: number; y: number; w: number; title: string; value: string }) {
  const left = Math.min(Math.max(x - 60, 0), w - 120);
  return (
    <div className="pointer-events-none absolute z-10 w-[120px] rounded-md border border-white/12 bg-void/95 px-2.5 py-1.5 text-xs shadow-xl" style={{ left, top: Math.max(0, y - 52) }}>
      <p className="text-silver-400">{title}</p>
      <p className="font-semibold tabular-nums text-snow">{value}</p>
    </div>
  );
}

function AreaPlot({ data, color, format, label, minY, maxY }: { data: SeriesPoint[]; color: string; format: (v: number) => string; label: (t: string) => string; minY?: number; maxY?: number }) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const gid = useId().replace(/[:«»]/g, "");
  const vals = data.map((d) => d.v);
  const min = minY ?? 0;
  const max = maxY !== undefined ? maxY : minY !== undefined ? Math.max(...vals) + (Math.max(...vals) - min) * 0.1 : niceMax(Math.max(...vals) * 1.1);
  const x = (i: number) => PAD.l + (i / Math.max(1, data.length - 1)) * (w - PAD.l - PAD.r);
  const y = (v: number) => PAD.t + (1 - (v - min) / (max - min || 1)) * (H - PAD.t - PAD.b);
  const line = data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d.v).toFixed(1)}`).join("");
  const area = `${line}L${x(data.length - 1).toFixed(1)},${H - PAD.b}L${x(0).toFixed(1)},${H - PAD.b}Z`;
  const labelEvery = Math.ceil(data.length / 6);

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - r.left;
    const i = Math.round(((px - PAD.l) / (w - PAD.l - PAD.r)) * (data.length - 1));
    setHover(Math.max(0, Math.min(data.length - 1, i)));
  };

  return (
    <div ref={ref} className="relative h-[190px]">
      {w > 0 && (
        <svg width={w} height={H} role="img" aria-label={`Line chart, ${data.length} points, latest ${format(vals[vals.length - 1])}`}>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={color} stopOpacity="0.28" />
              <stop offset="1" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <Grid w={w} max={max} min={min} format={format} />
          <path d={area} fill={`url(#${gid})`} />
          <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          {data.map((d, i) =>
            i % labelEvery === 0 || i === data.length - 1 ? (
              <text key={d.t} x={x(i)} y={H - 6} textAnchor={i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"} fontSize="10" fill="#6c7382">
                {label(d.t)}
              </text>
            ) : null,
          )}
          {hover !== null && (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={H - PAD.b} stroke="rgba(255,255,255,0.25)" strokeDasharray="3 3" />
              <circle cx={x(hover)} cy={y(data[hover].v)} r="5" fill={color} stroke="#0b0c10" strokeWidth="2" />
            </g>
          )}
          <rect x={PAD.l} y={0} width={Math.max(0, w - PAD.l - PAD.r)} height={H} fill="transparent" onPointerMove={onMove} onPointerLeave={() => setHover(null)} />
        </svg>
      )}
      {hover !== null && w > 0 && <Tooltip x={x(hover)} y={y(data[hover].v)} w={w} title={label(data[hover].t)} value={format(data[hover].v)} />}
    </div>
  );
}

function BarPlot({ data, color, format, label }: { data: SeriesPoint[]; color: string; format: (v: number) => string; label: (t: string) => string }) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const max = niceMax(Math.max(...data.map((d) => d.v)) * 1.1);
  const inner = w - PAD.l - PAD.r;
  const slot = inner / data.length;
  const bw = Math.max(4, Math.min(42, slot - 2 - slot * 0.35));
  const y = (v: number) => PAD.t + (1 - v / max) * (H - PAD.t - PAD.b);
  const labelEvery = Math.ceil(data.length / 8);

  return (
    <div ref={ref} className="relative h-[190px]">
      {w > 0 && (
        <svg width={w} height={H} role="img" aria-label={`Bar chart, ${data.length} bars`}>
          <Grid w={w} max={max} min={0} format={format} />
          {data.map((d, i) => {
            const cx = PAD.l + slot * i + slot / 2;
            const top = y(d.v), base = H - PAD.b;
            const hgt = Math.max(1, base - top);
            const r = Math.min(4, bw / 2, hgt);
            return (
              <g key={d.t}>
                {/* rounded data-end, square baseline */}
                <path
                  d={`M${cx - bw / 2},${base}V${top + r}Q${cx - bw / 2},${top} ${cx - bw / 2 + r},${top}H${cx + bw / 2 - r}Q${cx + bw / 2},${top} ${cx + bw / 2},${top + r}V${base}Z`}
                  fill={color}
                  opacity={hover === null || hover === i ? 1 : 0.45}
                />
                {(i % labelEvery === 0 || i === data.length - 1) && (
                  <text x={cx} y={H - 6} textAnchor="middle" fontSize="10" fill="#6c7382">
                    {label(d.t)}
                  </text>
                )}
                {/* hit target larger than the mark */}
                <rect x={PAD.l + slot * i} y={PAD.t} width={slot} height={H - PAD.t - PAD.b} fill="transparent" onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)} />
              </g>
            );
          })}
        </svg>
      )}
      {hover !== null && w > 0 && <Tooltip x={PAD.l + slot * hover + slot / 2} y={y(data[hover].v)} w={w} title={label(data[hover].t)} value={format(data[hover].v)} />}
    </div>
  );
}

/** Decorative inline sparkline for stat tiles (value is always shown as text beside it). */
export function Sparkline({ data, color = "royal", className = "" }: { data: number[]; color?: ChartColor; className?: string }) {
  if (data.length < 2) return null;
  const W = 100, Hs = 28;
  const min = Math.min(...data), max = Math.max(...data);
  const pts = data.map((v, i) => `${((i / (data.length - 1)) * W).toFixed(1)},${(Hs - 2 - ((v - min) / (max - min || 1)) * (Hs - 4)).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${Hs}`} preserveAspectRatio="none" className={`h-7 w-full ${className}`} aria-hidden="true">
      <polyline points={pts} fill="none" stroke={COLORS[color]} strokeWidth="1.6" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
